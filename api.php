<?php

error_reporting(~0);
ini_set('display_errors', 1);

$db_file = "data/airports.sqlite";
$messages = array();
$mode = "list";

if (!empty($_GET))
{
    if (isset($_GET['list']))
    {
        $mode = "list";
    }
    else if (isset($_GET['id']))
    {
        $mode = "id"; 
        $id = $_GET['id'];
        $id = strtoupper($id);
        $id = preg_replace("/[^[:alnum:]-]/", '', $id);
    }
}

class AirportsDB extends PDO 
{
    public function __construct($dsn, $username = null, $password = null, array $driver_options = null) 
    {
         parent :: __construct($dsn, $username, $password, $driver_options);
         $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
         $this->exec("CREATE TABLE IF NOT EXISTS airports (id TEXT, iata TEXT, name TEXT, type TEXT, country TEXT, city TEXT, lat1 DECIMAL(9,6), lon1 DECIMAL(9,6),  lat2 DECIMAL(9,6), lon2 DECIMAL(9,6), PRIMARY KEY (id));");
    }
    
    public function get_ids()
    {
        $ids = array();
        $result = $this->query('SELECT id FROM airports;');
        foreach ($result as $m) 
        {
            array_push($ids, $m['id']);
        }
        return $ids;
    }
    
    public function get_airport($id)
    {
      $result = $this->query('SELECT * FROM airports WHERE id IS "' . $id .'";');
      foreach ($result as $m) 
      {
          return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], "country" => $m["country"], "city" => $m["city"], 
                       "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"]);
      }
      return array();
    }
}

if ($mode == "list")
{
  $codes = array();

  try 
  {
      $db = new AirportsDB('sqlite:' . $db_file);
      $ids = $db->get_ids();
      $db = null;
  }
  catch (PDOException $e) 
  {
      array_push($messages, "Error: " . $e->getMessage());
  }
  
  $arr = array('messages' => $messages, 'ids' => $ids);
  echo json_encode($arr);
}
else if ($mode == "id")
{
  $airport = array();
  
  try 
  {
      $db = new AirportsDB('sqlite:' . $db_file);
      $airport = $db->get_airport($id);
      $db = null;
  }
  catch (PDOException $e) 
  {
      array_push($messages, "Error: " . $e->getMessage());
  }
  
  $arr = array('messages' => $messages, 'airport' => $airport);
  echo json_encode($arr);
}

?>

<?php

error_reporting(~0);
ini_set('display_errors', 1);

$db_file = "data/airports.sqlite";
$messages = array();
$mode = "list";
$query = "";
$runways = 0;

if (!empty($_GET))
{
    if (isset($_GET['id']))
    {
        $mode = "id"; 
        $query = $_GET['id'];
        $query = strtoupper($query);
        $query = preg_replace("/[^[:alnum:]-]/", '', $query);
    }
    else if (isset($_GET['search']))
    {
        $mode = "search"; 
        $query = $_GET['search'];
        $query = strtoupper($query);
        $query = preg_replace("/%20/", ' ', $query);
        $query = preg_replace("/[^[:alnum:]- ]/", '', $query);
    }
    else if (isset($_GET['random']))
    {
      $mode = "random";
      if (isset($_GET['runways']) && is_numeric($_GET['runways']))
      {
        $runways = intval($_GET['runways']);
      }
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
      $result = $this->query('SELECT * FROM airports WHERE id IS "' . $id .'" COLLATE NOCASE LIMIT 1;');
      foreach ($result as $m) 
      {
          return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], "country" => $m["country"], "city" => $m["city"], 
                       "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"]);
      }
      return array();
    }
    
    public function search_airport($query)
    {
      if ($query == "") 
      {
        return array();  
      }
      
      $result = $this->query('SELECT * FROM airports WHERE id IS "' . $query .'"  COLLATE NOCASE LIMIT 1;');
      foreach ($result as $m) 
      {
          return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], "country" => $m["country"], "city" => $m["city"], 
                       "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"]);
      }
      
      $result = $this->query('SELECT * FROM airports WHERE iata IS "' . $query .'"  COLLATE NOCASE LIMIT 1;');
      foreach ($result as $m) 
      {
          return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], "country" => $m["country"], "city" => $m["city"], 
                       "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"]);
      }
      
      $result = $this->query('SELECT * FROM airports WHERE name LIKE "%' . $query .'%"  COLLATE NOCASE LIMIT 1;');
      foreach ($result as $m) 
      {
          return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], "country" => $m["country"], "city" => $m["city"], 
                       "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"]);
      }
      
      $result = $this->query('SELECT * FROM airports WHERE city LIKE "%' . $query .'%"  COLLATE NOCASE LIMIT 1;');
      foreach ($result as $m) 
      {
          return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], "country" => $m["country"], "city" => $m["city"], 
                       "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"]);
      }
      
      return array();
    }
    
    public function get_random_airport($runways)
    {
      $result = $this->query('SELECT * FROM airports WHERE runways >= ' . $runways . ' ORDER BY RANDOM() LIMIT 1;');
      foreach ($result as $m) 
      {
          return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], "country" => $m["country"], "city" => $m["city"], 
                       "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"]);
      }
      return array();
    }
}

if ($mode == "id")
{
  $airport = array();
  
  try 
  {
      $db = new AirportsDB('sqlite:' . $db_file);
      $airport = $db->get_airport($query);
      $db = null;
  }
  catch (PDOException $e) 
  {
      array_push($messages, "Error: " . $e->getMessage());
  }
  
  $arr = array('messages' => $messages, 'airport' => $airport);
  echo json_encode($arr);
}
else if ($mode == "search")
{
  $airport = array();
  
  try 
  {
      $db = new AirportsDB('sqlite:' . $db_file);
      $airport = $db->search_airport($query);
      $db = null;
  }
  catch (PDOException $e) 
  {
      array_push($messages, "Error: " . $e->getMessage());
  }
  
  $arr = array('messages' => $messages, 'airport' => $airport);
  echo json_encode($arr);
}
else if ($mode == "random")
{
  $airport = array();
  
  try 
  {
      $db = new AirportsDB('sqlite:' . $db_file);
      $airport = $db->get_random_airport($runways);
      $db = null;
  }
  catch (PDOException $e) 
  {
      array_push($messages, "Error: " . $e->getMessage());
  }
  
  $arr = array('messages' => $messages, 'airport' => $airport);
  echo json_encode($arr);
}
else
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
?>

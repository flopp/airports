<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

$db_file = "data/airports.sqlite";
$votes_db_file = "data/votes.sqlite";
$messages = array();
$mode = "list";
$query = "";

function sanitize_query_id($s)
{
  $sanitized = strtoupper($s);
  $sanitized = preg_replace("/[^[:alnum:]-]/", '', $sanitized);
  return $sanitized;
}

function sanitize_query_string($s)
{
  $sanitized = strtoupper($s);
  $sanitized = preg_replace("/%20/", ' ', $sanitized);
  $sanitized = preg_replace("/\s+/", ' ', $sanitized);
  $sanitized = preg_replace("/[^[:alnum:]- ]/", '', $sanitized);
  return $sanitized;
}


if (!empty($_GET))
{
    if (isset($_GET['id']))
    {
        $mode = "id"; 
        $query = sanitize_query_id($_GET['id']);
    }
    else if (isset($_GET['search']))
    {
        $mode = "search"; 
        $query = sanitize_query_string($_GET['search']);
    }
    else if (isset($_GET['random']))
    {
      $mode = "random";
      if (isset($_GET['runways']) && is_numeric($_GET['runways']))
      {
        $runways = intval($_GET['runways']);
      }
    }
    else if (isset($_GET['vote']))
    {
      $mode = "vote";
      $query = sanitize_query_id($_GET['vote']);
    }
    else if (isset($_GET['votes'])) 
    {
      $mode = "votes";
      $query = sanitize_query_id($_GET['votes']);
    }
}

class AirportsDB extends PDO 
{
    public function __construct($dsn, $username = null, $password = null, array $driver_options = null) 
    {
         parent :: __construct($dsn, $username, $password, $driver_options);
         $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
         $this->exec("CREATE TABLE IF NOT EXISTS airports (id TEXT PRIMARY KEY, iata TEXT, name TEXT, type TEXT, country TEXT, region TEXT, city TEXT, lat1 DECIMAL(9,6), lon1 DECIMAL(9,6), lat2 DECIMAL(9,6), lon2 DECIMAL(9,6), nearby1 TEXT, nearby2 TEXT, nearby3 TEXT);");
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
    
    public function to_array($m)
    {
      return array("id" => $m["id"], "iata" => $m["iata"], "name" => $m["name"], "type" => $m["type"], 
      "country" => $m["country"], "region" => $m["region"], "city" => $m["city"], 
      "lat1" => $m["lat1"], "lng1" => $m["lng1"], "lat2" => $m["lat2"], "lng2" => $m["lng2"], 
      "nearby1" => $m["nearby1"], "nearby2" => $m["nearby2"], "nearby3" => $m["nearby3"]);
    }
    
    public function get_airport($id)
    {
      $result = $this->query('SELECT * FROM airports WHERE id IS "' . $id .'" COLLATE NOCASE LIMIT 1;');
      foreach ($result as $m) 
      {
          return $this->to_array($m);
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
          return $this->to_array($m);
      }
      
      $result = $this->query('SELECT * FROM airports WHERE iata IS "' . $query .'"  COLLATE NOCASE LIMIT 1;');
      foreach ($result as $m) 
      {
          return $this->to_array($m);
      }
      
      $result = $this->query('SELECT * FROM airports WHERE name LIKE "%' . $query .'%"  COLLATE NOCASE ORDER BY runways DESC LIMIT 1;');
      foreach ($result as $m) 
      {
          return $this->to_array($m);
      }
      
      $result = $this->query('SELECT * FROM airports WHERE city LIKE "%' . $query .'%"  COLLATE NOCASE ORDER BY runways DESC LIMIT 1;');
      foreach ($result as $m) 
      {
          return $this->to_array($m);
      }
      
      return array();
    }
    
    public function get_random_airport()
    {
      if (rand(0,1)) {
        // large airport
        $result = $this->query('SELECT * FROM airports WHERE type IS "L" ORDER BY RANDOM() LIMIT 1;');
        foreach ($result as $m) 
        {
          return $this->to_array($m);
        }
      } else if (rand(0,1)) {
        // medium airport
        $result = $this->query('SELECT * FROM airports WHERE type IS "M" ORDER BY RANDOM() LIMIT 1;');
        foreach ($result as $m) 
        {
          return $this->to_array($m);
        }
      } else {
        // any (large, medium, small) airport
        $result = $this->query('SELECT * FROM airports ORDER BY RANDOM() LIMIT 1;');
        foreach ($result as $m) 
        {
          return $this->to_array($m);
        }
      }
      
      return array();
    }
}


class VotesDB extends PDO 
{
    public function __construct($dsn, $username = null, $password = null, array $driver_options = null) 
    {
         parent :: __construct($dsn, $username, $password, $driver_options);
         $this->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
         $this->exec("CREATE TABLE IF NOT EXISTS votes (id TEXT PRIMARY KEY, votes INTEGER);");
    }
    
    public function exists($id)
    {
        $sql = 'SELECT * FROM votes WHERE id IS "' . $id . '" LIMIT 1;';
        //echo $sql;
        $result = $this->query($sql);
        foreach ($result as $m) 
        {
            return true;
        }
        return false;
    }
    
    public function votes($id)
    {
        $sql = 'SELECT * FROM votes;';
        if ($id != "")
        {
          $sql = 'SELECT * FROM votes WHERE id IS "' . $id . '" COLLATE NOCASE LIMIT 1;';
        }
        //echo $sql;
        $a = array();
        $result = $this->query($sql);
        foreach ($result as $m) 
        {
            array_push($a, array("id" => $m['id'], "votes" => $m['votes']));
        }
        return $a;
    }
    
    public function vote($id)
    {
      if ($this->exists($id)) 
      {
        $sql = 'UPDATE votes SET votes = (votes + 1) WHERE id IS "' . $id . '" COLLATE NOCASE;';
        //echo $sql;
        $this->exec($sql);
      }
      else
      {
        $sql = 'INSERT INTO votes (id, votes) VALUES ("' . $id . '", 1);';
        //echo $sql;
        $this->exec($sql);
      }
      
      return $this->votes($id);
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
      $airport = $db->get_random_airport();
      $db = null;
  }
  catch (PDOException $e) 
  {
      array_push($messages, "Error: " . $e->getMessage());
  }
  
  $arr = array('messages' => $messages, 'airport' => $airport);
  echo json_encode($arr);
}
else if ($mode == "vote") 
{
  $votes = array();
  
  if ($query != "") 
  {
    try 
    {
      $db = new VotesDB('sqlite:' . $votes_db_file);
      $votes = $db->vote($query);
      $db = null;
    }
    catch (PDOException $e) 
    {
        array_push($messages, "Error: " . $e->getMessage());
    }
  }
  else
  {
    array_push($messages, "Error: no airport id given");
  }
  
  $arr = array('messages' => $messages, 'votes' => $votes);
  echo json_encode($arr);
}
else if ($mode == "votes") 
{
  $votes = array();
  
  try 
  {
    $db = new VotesDB('sqlite:' . $votes_db_file);
    $votes = $db->votes($query);
    $db = null;
  } 
  catch (PDOException $e) 
  {
      array_push($messages, "Error: " . $e->getMessage());
  }
  
  $arr = array('messages' => $messages, 'votes' => $votes);
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

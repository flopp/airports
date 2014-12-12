<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  
  <body>
<?php

$id = "";
if(!empty($_GET)) 
{
  if(isset($_GET['id'])) { $id = $_GET['id']; }
}
  echo "id=$id";
?>
  </body>
</html>

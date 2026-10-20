<?php
include ("conecta.php");

$id= $_POST ['id'];
$vrql= "DELETE  FROM estudiantes WHERE ID_EST= '$id' ";

$resul = $conexion->query($vrql);


?>
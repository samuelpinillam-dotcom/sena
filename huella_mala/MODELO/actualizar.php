<?php
include ("conecta.php");

$id= $_POST ['id'];
$act= $_POST ['act'];
$vrql= "UPDATE estudiantes SET ACTIVO= '$act' WHERE ID_EST='$id'";

$resul = $conexion->query($vrql);


?>
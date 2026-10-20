<?php
include ("conecta.php");

$curso= $_POST ['cur'];
$vrql= "SELECT * FROM estudiantes WHERE CURSO= '$curso' ";
$resul = $conexion->query($vrql);
if ($resul ->num_rows > 0)
   while($fila = $resul ->fetch_assoc()){

   echo "ID_EST : " . $fila ["ID_EST"] . "<br>";
   echo "NOMBRE : " . $fila ["NOMBRE"] . "<br>";
   echo "CURSO : " . $fila ["CURSO"] . "<br>";
   echo "CORREO: " . $fila ["CORREO"] . "<br>";
   echo "<hr>";


}
else
    echo "no existen registros";

?>
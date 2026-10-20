<?php
include("conecta.php");

$busqueda = $_POST['bus'];
$sql = "SELECT * FROM menu WHERE NOM_MENU LIKE '%$busqueda%' OR INGRE_MENU LIKE '%$busqueda%'";
$resul = $conexion->query($sql);

if ($resul->num_rows > 0) {
    while($fila = $resul->fetch_assoc()){
        echo "ID_MENU : " . $fila["ID_MENU"] . "<br>";
        echo "NOM_MENU : " . $fila["NOM_MENU"] . "<br>";
        echo "INGRE_MENU : " . $fila["INGRE_MENU"] . "<br>";
        echo "<hr>";
    }
} else {
    echo "No existen registros para este menú.";
}
?>
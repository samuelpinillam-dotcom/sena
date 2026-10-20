<?php
include("conecta.php");

$id = $_POST['id'];
$sql = "DELETE FROM menu WHERE ID_MENU = '$id'";

if ($conexion->query($sql)) {
    echo "Menú eliminado correctamente.";
} else {
    echo "Error al eliminar: " . $conexion->error;
}
?>
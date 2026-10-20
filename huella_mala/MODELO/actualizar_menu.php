<?php
include("conecta.php");

$id = $_POST['id'];
$menu = $_POST['menu'];
$ingre = $_POST['ingre'];

$sql = "UPDATE menu SET NOM_MENU = '$menu', INGRE_MENU = '$ingre' WHERE ID_MENU = '$id'";

if ($conexion->query($sql)) {
    echo "Menú actualizado correctamente.";
} else {
    echo "Error al actualizar: " . $conexion->error;
}
?>
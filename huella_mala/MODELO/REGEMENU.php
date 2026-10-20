<?php
  include ("conecta.php");
// se recogen los valores del formulario y se guardan en las varaiables

 if ($_SERVER["REQUEST_METHOD"] == "POST") 
    {
      $menus = $_POST['menu'];
      $ingredientes = $_POST['ingre'];
  
  }




echo "<br>antes de insertar <br>";
$sql = "INSERT INTO menu (ID_MENU, NOM_MENU, INGRE_MENU) values ('NULL', '$menus','$ingredientes')";
if ($conexion->query($sql)) {
    echo "Usuario registrado";
} else {
    echo "Error: " . $conexion->error;
}

echo "<br> fin del modulo <br>";

?>
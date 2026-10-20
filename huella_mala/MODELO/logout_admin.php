<?php
session_start();
session_unset();
session_destroy();
// Ibaliwmo ti file ken lokasion ditoy no sadino ti kayatmo a pagturongan (kas pagarigan: ../index.html)
header("Location: ../index.html"); 
exit();
?>
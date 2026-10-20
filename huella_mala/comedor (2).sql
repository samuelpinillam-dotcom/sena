-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-10-2026 a las 04:05:44
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `comedor`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia_huella`
--

CREATE TABLE `asistencia_huella` (
  `ID_ASISTENCIA` int(11) NOT NULL,
  `ID_EST` int(11) NOT NULL,
  `FECHA_HORA` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `asistencia_huella`
--

INSERT INTO `asistencia_huella` (`ID_ASISTENCIA`, `ID_EST`, `FECHA_HORA`) VALUES
(1, 10, '2026-10-02 01:11:29'),
(2, 11, '2026-10-02 01:11:29'),
(3, 12, '2026-10-02 01:11:29'),
(4, 7, '2026-10-02 01:11:29'),
(5, 3, '2026-10-02 01:11:29'),
(6, 1, '2026-10-02 01:11:29'),
(7, 4, '2026-10-02 01:11:29'),
(8, 14, '2026-10-02 01:11:29'),
(9, 8, '2026-10-02 01:11:29'),
(10, 5, '2026-10-02 01:11:29'),
(11, 6, '2026-10-02 01:11:29'),
(12, 9, '2026-10-02 01:11:29'),
(13, 13, '2026-10-02 01:11:29'),
(14, 10, '2026-10-02 01:12:11'),
(15, 1, '2026-10-02 01:16:43'),
(16, 1, '2026-10-02 01:41:25'),
(17, 6, '2026-10-02 13:02:15'),
(18, 6, '2026-10-02 13:08:36'),
(19, 6, '2026-10-02 13:21:48'),
(20, 6, '2026-10-02 14:45:35'),
(21, 6, '2026-10-02 14:50:25'),
(22, 7, '2026-10-15 13:34:55'),
(23, 3, '2026-10-15 15:14:45'),
(24, 16, '2026-10-15 15:14:46'),
(25, 16, '2026-10-15 15:14:47'),
(26, 16, '2026-10-15 15:14:50'),
(27, 16, '2026-10-15 15:14:53'),
(28, 16, '2026-10-15 15:14:55'),
(29, 16, '2026-10-15 15:14:57'),
(30, 3, '2026-10-15 15:15:09'),
(31, 16, '2026-10-15 15:15:09'),
(32, 16, '2026-10-15 15:15:11'),
(33, 3, '2026-10-15 15:16:37'),
(34, 3, '2026-10-15 15:18:23'),
(35, 16, '2026-10-15 15:18:41'),
(36, 3, '2026-10-15 15:18:52'),
(37, 6, '2026-10-15 15:24:08'),
(38, 3, '2026-10-15 15:24:11'),
(39, 6, '2026-10-15 15:24:12'),
(40, 3, '2026-10-15 15:24:34'),
(41, 6, '2026-10-15 15:24:35'),
(42, 3, '2026-10-15 15:25:09'),
(43, 3, '2026-10-15 15:27:31'),
(44, 14, '2026-10-15 15:27:32'),
(45, 14, '2026-10-15 15:27:34'),
(46, 16, '2026-10-15 15:31:23'),
(47, 14, '2026-10-15 15:32:01'),
(48, 6, '2026-10-15 15:33:53'),
(49, 16, '2026-10-15 15:39:15'),
(50, 16, '2026-10-15 15:39:18'),
(51, 16, '2026-10-15 15:39:20'),
(52, 16, '2026-10-15 15:39:47'),
(53, 14, '2026-10-15 15:44:24'),
(54, 14, '2026-10-15 15:44:26'),
(55, 14, '2026-10-15 15:45:13'),
(56, 16, '2026-10-15 15:47:14'),
(57, 16, '2026-10-15 15:48:38'),
(58, 14, '2026-10-15 15:51:01'),
(59, 14, '2026-10-15 16:37:36'),
(60, 7, '2026-10-15 16:38:08'),
(61, 14, '2026-10-15 16:39:17'),
(62, 14, '2026-10-15 16:41:46'),
(63, 16, '2026-10-15 16:50:34'),
(64, 16, '2026-10-15 16:51:38'),
(65, 6, '2026-10-15 16:53:28'),
(66, 16, '2026-10-15 16:58:18'),
(67, 7, '2026-10-15 17:04:58'),
(68, 16, '2026-10-15 17:05:13'),
(69, 19, '2026-10-15 17:08:51'),
(70, 18, '2026-10-15 17:11:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `ID_EST` int(11) NOT NULL,
  `NOMBRE` varchar(100) NOT NULL,
  `CURSO` varchar(50) NOT NULL,
  `CORREO` varchar(100) NOT NULL,
  `ACTIVO` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT '12345'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`ID_EST`, `NOMBRE`, `CURSO`, `CORREO`, `ACTIVO`, `password`) VALUES
(1, 'Jeronimo Rivera', '1101', 'jeronimorivera282@gmail.com', NULL, '$2y$10$Ku1OtnLCqAbhQ.s7DSivu.CTRBmxefUNFXXHexWS5YzpoSrhz/Yza'),
(3, 'Emmanuel Silgado Solórzano', '1101', 'emmanuelsilgados@juandelcorral.edu.co', NULL, '$2y$10$hO2/6iAVOQ7F0SCI7V/4F.EbNoBuNA560dOASGjCNXfyqv/qANg6C'),
(4, 'julian Steven Diaz Menjura', '1101', 'juliansdiazm@juandelcorral.edu.co', NULL, '$2y$10$b4iOK.UO/VSZHhJSHoEzFOFX8aK0GudjDwj0Tw.4irvX2GdhOGOjW'),
(5, 'Miguel David Terraza Mendoza', '1101', 'migueldterrazam@juandelcorral.edu.co', NULL, '$2y$10$uoBtw8R5nLsXJSI41am9KeaccKZ9KQA6HfiSlNhkWbjcvnljOVM9O'),
(6, 'Samuel Pinilla Martin', '1101', 'Samuelpinillam@juandelcorral.edu.co', NULL, '$2y$10$xgDlqGNRtO5g..8I10UCru0jbZFWZTQg0Pk.6eTizmgd0vWXmfXri'),
(7, 'Emanuel Santiago Delgadi Ardila', '1101', 'Emanel535353@gmail.com', NULL, '$2y$10$JRV4ns8UreSps5ccCOZXF.tw.opzv3hutRD.nOfCrRvJIfCfV118u'),
(8, 'maria fernanda alvarez garcia', '1101', 'mariafalvarezg@juandelcorral.edu.co', NULL, '$2y$10$53mWoKzcgiG2urTI0YaCluPgl8dhF.xZ.FIc4exdwlSeu2eNaDPNS'),
(9, 'Sara Katerin Valderrama Montaña', '1101', 'sarakvalderramam@juandelcorral.edu.co', NULL, '$2y$10$ttESUAGOxKBscTnuLyJZhuMU3yI3ESkM.lToBUEqbxy253cSRmZFG'),
(10, 'Daian Thomas Diaz Rojas', '1101', 'daiantdiazr@juandelcorral.edu.co', NULL, '$2y$10$jtu.q0ie9MMc8165qet8OONP7tJP7jWOteKG4kmukrqWp3xMAq05y'),
(11, 'David Alonso', '1101', 'davidaalonsoc@juandelcorral.edu.co', NULL, '$2y$10$VIuIo3aOYjmyNhB61L50vOdshbPf6GaLc3hdSEJ0WvXr4HEk3XeOu'),
(12, 'dominit galeano ', '1101', 'dominitcgaleanom@juandelcorral.edu.co', NULL, '$2y$10$wqeDyr36LZTLPJodSA4BP.RtHyZhlUO16yTgcABvW9eLOAUcclcLS'),
(13, 'thomas quintana', '1101', 'thomasquintana585@gmail.com', NULL, '$2y$10$FCAJ0nWN8IDnYN/nOdQRueajlvwRefUNfkmJbIUCxXTdLrGDVx69e'),
(14, 'Kevin Santiago González Cerquera ', '1101', 'kevinsgonzalezc@juandelcorral.edu.co', NULL, '$2y$10$Ig/Mkr2.DpZndxXS7vwoiuMFdQ6GuytO147QqsQZhp5WJABbZng8C'),
(15, 'miguel saavedra', '1101', 'waresoluciones@gmail.com', NULL, '12345'),
(16, 'Rafa', 'Física', 'radacode@gmail.com', NULL, '12345'),
(17, 'Ian Guerrero', '902', 'ianjguerreros@juandelcorral.edu.co', NULL, '$2y$10$FRpRBRyprxxLoizxR5568ufrfVO/CyKLDHayHIflLwmR.hbDHeo.W'),
(18, 'deimer urango urrutia', '1103', 'deimers481@gmail.com', NULL, '$2y$10$cYYpMvCG8T8yYz/GqfsyGO9.hT2.sqC71qRReOi2LZqOLPOalpI8m'),
(19, 'Joseph Felipe Jerez Maza', '1101', 'jj4652329@gmail.com', NULL, '$2y$10$DOvyUjSDPOSXAUCtsQVGcO7fydtMHwgWIdrBLazCGb6otTx9UUiyC');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menu`
--

CREATE TABLE `menu` (
  `ID_MENU` int(11) NOT NULL,
  `NOM_MENU` varchar(100) NOT NULL,
  `INGRE_MENU` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `menu`
--

INSERT INTO `menu` (`ID_MENU`, `NOM_MENU`, `INGRE_MENU`) VALUES
(1, 'perros ', '1001'),
(2, 'lentejas con pollo', ''),
(3, 'lentejas con pollo', '906');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asistencia_huella`
--
ALTER TABLE `asistencia_huella`
  ADD PRIMARY KEY (`ID_ASISTENCIA`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`ID_EST`);

--
-- Indices de la tabla `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`ID_MENU`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asistencia_huella`
--
ALTER TABLE `asistencia_huella`
  MODIFY `ID_ASISTENCIA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `ID_EST` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `menu`
--
ALTER TABLE `menu`
  MODIFY `ID_MENU` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

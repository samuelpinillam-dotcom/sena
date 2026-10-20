-- =====================================================================
--  LYON TECHNOLOGIES · Sistema de Gestión de Facturación e Inventario
--  schema.sql — FINAL COMPLETO · ORDEN CORREGIDO (v2)
--  ✔ Fix: productos/promociones se crean ANTES de proveedor_productos
-- =====================================================================
DROP DATABASE IF EXISTS Tienda_Electrodomesticos;
CREATE DATABASE Tienda_Electrodomesticos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Tienda_Electrodomesticos;

/* ============ 1 · SEGURIDAD: roles y módulos (RF006) ============ */
CREATE TABLE roles (
  nombre VARCHAR(30) NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

CREATE TABLE modulos (
  id_modulo INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE rol_modulo (
  rol       VARCHAR(30) NOT NULL,
  id_modulo INT         NOT NULL,
  PRIMARY KEY (rol, id_modulo),
  CONSTRAINT fk_rm_rol    FOREIGN KEY (rol)       REFERENCES roles(nombre)      ON UPDATE CASCADE,
  CONSTRAINT fk_rm_modulo FOREIGN KEY (id_modulo) REFERENCES modulos(id_modulo) ON DELETE CASCADE
) ENGINE=InnoDB;

/* ============ 2 · USUARIO (entidad padre) ============ */
CREATE TABLE usuarios (
  id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(80) NOT NULL,
  apellido         VARCHAR(80) NOT NULL,
  tipo_documento   ENUM('CC','TI','CE') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  email            VARCHAR(120) NOT NULL UNIQUE,
  password         VARCHAR(255) NOT NULL,
  rol              ENUM('Administrador','Empleado','Proveedor','Cliente') NOT NULL,
  direccion        VARCHAR(160) NOT NULL,
  telefono         VARCHAR(20) NOT NULL,
  estado           ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  fecha_registro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

/* ============ 3 · ESPECIALIZACIONES 1:1 (relación "tiene") ============ */
CREATE TABLE clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL UNIQUE,
  nombre     VARCHAR(120) NOT NULL,
  email      VARCHAR(120) UNIQUE,
  telefono   VARCHAR(20),
  saldo      DECIMAL(12,2) NOT NULL DEFAULT 0,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cli_usr FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario   INT NULL UNIQUE,
  nombre       VARCHAR(120) NOT NULL,
  contacto     VARCHAR(120),
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prov_usr FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

/* ============ 4 · INVENTARIO (✔ ahora ANTES de proveedor_productos) ============ */
CREATE TABLE productos (
  id_producto  INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(120) NOT NULL UNIQUE,
  descripcion  TEXT,
  precio       DECIMAL(12,2) NOT NULL DEFAULT 0,
  costo        DECIMAL(12,2) NOT NULL DEFAULT 0,
  cantidad     INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 3,
  estado       ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_prod CHECK (cantidad >= 0 AND precio >= 0 AND costo >= 0)
) ENGINE=InnoDB;

/* ============ 5 · PROMOCIONES (RF011) ============ */
CREATE TABLE promociones (
  id_promocion INT AUTO_INCREMENT PRIMARY KEY,
  id_producto  INT NOT NULL,
  nombre       VARCHAR(120) NOT NULL,
  descuento    TINYINT UNSIGNED NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  estado       ENUM('Activa','Inactiva') NOT NULL DEFAULT 'Activa',
  CONSTRAINT chk_promo CHECK (descuento BETWEEN 1 AND 100),
  CONSTRAINT fk_promo_prod FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

/* ============ 6 · PROVEEDOR_PRODUCTOS (✔ ahora DESPUÉS de productos) ============ */
CREATE TABLE proveedor_productos (
  id_proveedor INT NOT NULL,
  id_producto  INT NOT NULL,
  PRIMARY KEY (id_proveedor, id_producto),
  CONSTRAINT fk_pp_prov FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE CASCADE,
  CONSTRAINT fk_pp_prod FOREIGN KEY (id_producto)  REFERENCES productos(id_producto)   ON DELETE CASCADE
) ENGINE=InnoDB;

/* ============ 7 · VENTA / FACTURACIÓN (RF003 · RF004) ============ */
CREATE TABLE ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  numero   VARCHAR(20) NOT NULL UNIQUE,
  id_cliente INT NULL,
  id_usuario INT NULL,
  cliente_nombre VARCHAR(160) NOT NULL DEFAULT 'Cliente general',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
  iva       DECIMAL(12,2) NOT NULL DEFAULT 0,
  total     DECIMAL(12,2) NOT NULL DEFAULT 0,
  id_promocion INT NULL,
  fecha  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('Activa','Enviada','Ajustada','Anulada') NOT NULL DEFAULT 'Activa',
  CONSTRAINT chk_ven CHECK (total >= 0 AND subtotal >= 0),
  CONSTRAINT fk_v_cli  FOREIGN KEY (id_cliente)   REFERENCES clientes(id_cliente)      ON DELETE SET NULL,
  CONSTRAINT fk_v_usr  FOREIGN KEY (id_usuario)   REFERENCES usuarios(id_usuario)      ON DELETE SET NULL,
  CONSTRAINT fk_v_prom FOREIGN KEY (id_promocion) REFERENCES promociones(id_promocion) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE venta_items (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  id_venta    INT NOT NULL,
  id_producto INT NULL,
  nombre      VARCHAR(120) NOT NULL DEFAULT '',
  precio      DECIMAL(12,2) NOT NULL DEFAULT 0,
  cantidad    INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_vi_venta FOREIGN KEY (id_venta)    REFERENCES ventas(id_venta)       ON DELETE CASCADE,
  CONSTRAINT fk_vi_prod  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_vi_venta ON venta_items(id_venta);
CREATE INDEX idx_v_usr    ON ventas(id_usuario);
CREATE INDEX idx_v_cli    ON ventas(id_cliente);

/* ============ 8 · DEVOLUCIONES (RF007) ============ */
CREATE TABLE devoluciones (
  id_devolucion INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_item  INT NOT NULL,
  cantidad INT NOT NULL,
  motivo   VARCHAR(255) NOT NULL,
  estado   ENUM('Pendiente','Validada') NOT NULL DEFAULT 'Pendiente',
  nota_credito VARCHAR(20) NULL,
  id_usuario_valida INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_d_venta FOREIGN KEY (id_venta) REFERENCES ventas(id_venta)      ON DELETE CASCADE,
  CONSTRAINT fk_d_item  FOREIGN KEY (id_item)  REFERENCES venta_items(id_item)  ON DELETE CASCADE,
  CONSTRAINT fk_d_usr   FOREIGN KEY (id_usuario_valida) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  CONSTRAINT chk_dev CHECK (cantidad > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_d_venta ON devoluciones(id_venta);

/* ============ 9 · PEDIDOS + HISTORIAL + ENTREGAS ============ */
CREATE TABLE pedidos (
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NULL,
  cliente   VARCHAR(160),
  direccion VARCHAR(200) NOT NULL,
  estado    ENUM('Preparando','Enviado','Entregado') NOT NULL DEFAULT 'Preparando',
  fecha     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE pedido_productos (
  id_pedido   INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad    INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id_pedido, id_producto),
  CONSTRAINT fk_pdp_ped  FOREIGN KEY (id_pedido)   REFERENCES pedidos(id_pedido)     ON DELETE CASCADE,
  CONSTRAINT fk_pdp_prod FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Historial de cambios de estado (CU005 Logística paso 5)
CREATE TABLE pedido_estados (
  id_estado INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  estado    ENUM('Preparando','Enviado','Entregado') NOT NULL,
  id_usuario INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pe_ped FOREIGN KEY (id_pedido)  REFERENCES pedidos(id_pedido)   ON DELETE CASCADE,
  CONSTRAINT fk_pe_usr FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Etiquetas de envío y recibos de entrega (CU004-3 · CU005-1 Logística)
CREATE TABLE entregas (
  id_entrega INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  codigo_seguimiento VARCHAR(30) NOT NULL UNIQUE,
  tipo ENUM('Etiqueta','Recibo') NOT NULL,
  transportadora VARCHAR(60) NOT NULL DEFAULT 'Mercado Envíos',
  generado_por INT NULL,
  fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ent_ped FOREIGN KEY (id_pedido)    REFERENCES pedidos(id_pedido)   ON DELETE CASCADE,
  CONSTRAINT fk_ent_usr FOREIGN KEY (generado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

/* ============ 10 · SOPORTE TÉCNICO (RF010) ============ */
CREATE TABLE soporte_tecnico (
  id_soporte INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  id_asignado INT NULL,
  asunto     VARCHAR(150) NOT NULL,
  mensaje    TEXT NOT NULL,
  respuesta  TEXT NULL,
  estado     ENUM('Abierto','En proceso','Cerrado') NOT NULL DEFAULT 'Abierto',
  fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_st_usr FOREIGN KEY (id_usuario)  REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_st_asg FOREIGN KEY (id_asignado) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

/* ============ 11 · REPORTES (RF008) ============ */
CREATE TABLE reportes_generados (
  id_reporte INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  tipo   VARCHAR(50) NOT NULL DEFAULT 'ventas',
  contenido TEXT NULL,
  datos_json LONGTEXT NULL,
  creado_por INT NULL,
  publicado TINYINT(1) NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_rg_usr FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

/* ============ 12 · BITÁCORA DE ACTIVIDAD (RF012) ============ */
CREATE TABLE bitacora_actividad (
  id_bitacora INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  accion  VARCHAR(50) NOT NULL,
  detalle VARCHAR(255) NOT NULL,
  modulo  VARCHAR(50) NULL,
  ip      VARCHAR(45) NULL,
  fecha   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bit_usr FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE INDEX idx_bit_usr   ON bitacora_actividad(id_usuario);
CREATE INDEX idx_bit_fecha ON bitacora_actividad(fecha);

/* ============ 13 · CHAT INTERNO (RF013) ============ */
CREATE TABLE mensajes_chat (
  id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
  id_remitente   INT NOT NULL,
  id_destinatario INT NULL,
  mensaje TEXT NOT NULL,
  leido   TINYINT(1) NOT NULL DEFAULT 0,
  fecha   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_remi FOREIGN KEY (id_remitente)    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_chat_dest FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_chat_dest ON mensajes_chat(id_destinatario, leido);

/* ============ 14 · TRIGGERS (integridad automática) ============ */
DELIMITER $$ 
-- Devuelve stock si se BORRA una línea de venta,
-- salvo que la factura ya estuviera 'Anulada' (el stock ya fue devuelto por la API).
CREATE TRIGGER trg_vi_stock_del AFTER DELETE ON venta_items
FOR EACH ROW
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ventas v
                 WHERE v.id_venta = OLD.id_venta AND v.estado = 'Anulada') THEN
    UPDATE productos SET cantidad = cantidad + OLD.cantidad
      WHERE id_producto = OLD.id_producto;
  END IF;
END$$ 
-- Impiden stock negativo (RF002 / CU004)
CREATE TRIGGER trg_prod_bi BEFORE INSERT ON productos
FOR EACH ROW
BEGIN
  IF NEW.cantidad < 0 THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'La cantidad no puede ser negativa'; END IF;
END$$ 
CREATE TRIGGER trg_prod_bu BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
  IF NEW.cantidad < 0 THEN SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'La cantidad no puede ser negativa'; END IF;
END$$ 
-- Estado inicial del historial de seguimiento al crear un pedido
CREATE TRIGGER trg_ped_bi AFTER INSERT ON pedidos
FOR EACH ROW
BEGIN
  INSERT INTO pedido_estados (id_pedido, estado) VALUES (NEW.id_pedido, 'Preparando');
END$$ 
DELIMITER ;

/* ============ 15 · DATOS INICIALES ============ */
INSERT INTO roles (nombre) VALUES ('Administrador'),('Empleado'),('Proveedor'),('Cliente');

INSERT INTO modulos (nombre) VALUES
 ('Resumen de empresa'),('Gestión de usuarios'),('Ventas'),('Clientes'),
 ('Proveedores'),('Pedidos'),('Inventario'),('Devoluciones'),
 ('Soporte Técnico'),('Facturas'),('Reportes'),('Promociones'),
 ('Productos'),('Etiquetas'),('Recibos'),('Tienda'),('Mis compras'),('Abastecer'),
 ('Chat interno'),('Historial de actividad');

INSERT INTO rol_modulo (rol, id_modulo)
SELECT r.nombre, m.id_modulo FROM roles r JOIN modulos m
WHERE (r.nombre='Administrador' AND m.nombre IN
  ('Resumen de empresa','Gestión de usuarios','Ventas','Productos','Clientes','Proveedores',
   'Pedidos','Inventario','Devoluciones','Soporte Técnico','Facturas','Reportes','Promociones',
   'Chat interno','Historial de actividad'))
   OR (r.nombre='Empleado' AND m.nombre IN
  ('Resumen de empresa','Ventas','Productos','Pedidos','Etiquetas','Recibos',
   'Proveedores','Promociones','Soporte Técnico','Facturas','Reportes','Chat interno'))
   OR (r.nombre='Proveedor' AND m.nombre IN
  ('Pedidos','Etiquetas','Recibos','Abastecer','Chat interno'))
   OR (r.nombre='Cliente' AND m.nombre IN
  ('Tienda','Mis compras','Facturas','Devoluciones','Soporte Técnico'));

-- Los 9 productos del catálogo inicial
INSERT INTO productos (nombre, descripcion, precio, costo, cantidad, stock_minimo) VALUES
 ('GPU X200','Tarjeta gráfica 8GB GDDR6 · Ray Tracing',1200000,900000,5,3),
 ('Intel i7 13700','Procesador de 12 núcleos híbridos',850000,650000,3,3),
 ('Kit RAM 16GB DDR4','2x8GB alta frecuencia · Disipación',220000,160000,12,3),
 ('Television LG 55" 4K','Smart TV Ultra HD · HDR10',3200000,2500000,8,3),
 ('Barra Sony 2.1','Barra de sonido con subwoofer',650000,480000,10,3),
 ('Nevera LG 300L','Inverter · Ahorro energético',2500000,1900000,6,3),
 ('Lavadora Samsung 18kg','Automática · Carga frontal',1900000,1450000,7,3),
 ('A/A Whirlpool','Aire acondicionado Inverter',1800000,1400000,6,3),
 ('Microondas Challenger','Capacidad familiar · Digital',480000,350000,15,3);

-- Administrador inicial: entra con admin@lyontech.net / password
INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, email, password, rol, direccion, telefono, estado)
VALUES ('Admin','Lyon','CC','1000001','admin@lyontech.net',
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Administrador','Cra 56bis #78-12','3000000001','Activo');
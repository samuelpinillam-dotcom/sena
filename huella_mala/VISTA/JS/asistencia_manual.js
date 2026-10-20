/**
 * Función para alternar el color visual y el estado activo 
 * de los botones de asistencia (Chulito verde o X roja).
 */
function marcarOpcion(idEst, valor) {
    const lblCheck = document.getElementById('lbl_check_' + idEst);
    const lblX = document.getElementById('lbl_x_' + idEst);
    
    if (valor === '1') {
        lblCheck.classList.add('activo');
        lblX.classList.remove('activo');
    } else {
        lblX.classList.add('activo');
        lblCheck.classList.remove('activo');
    }
}
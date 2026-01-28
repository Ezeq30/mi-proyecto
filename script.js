// Array para almacenar todas las apuestas
let apuestas = [];
// ID de la última apuesta agregada o modificada (para resaltar en la tabla)
let ultimaApuestaId = null;

// Referencias a elementos del DOM
const form = document.getElementById('apuestaForm');
const tipoApuestaSelect = document.getElementById('tipoApuesta');
const montoInput = document.getElementById('monto');
const carrerasInput = document.getElementById('carreras');
const tablaBody = document.getElementById('tablaBody');
const mensajeVacio = document.getElementById('mensajeVacio');

// Función para formatear el tipo de apuesta (mayúsculas)
function formatearTipoApuesta(tipo) {
    return tipo.toUpperCase();
}

// Orden personalizado de tipos de apuestas
const ordenTiposApuesta = ['EXA', 'IMP', 'TRI', 'DOB', 'TPL', 'QTN', 'QTP', 'CAD', 'CUA'];

// Función para obtener el índice de orden de un tipo de apuesta
function obtenerIndiceOrden(tipo) {
    const tipoFormateado = formatearTipoApuesta(tipo);
    const indice = ordenTiposApuesta.indexOf(tipoFormateado);
    // Si no se encuentra en el orden, ponerlo al final
    return indice === -1 ? ordenTiposApuesta.length : indice;
}

// Función para comparar dos apuestas según el orden personalizado
function compararApuestas(a, b) {
    const indiceA = obtenerIndiceOrden(a.tipo);
    const indiceB = obtenerIndiceOrden(b.tipo);
    
    // Si tienen el mismo índice de orden, mantener el orden original
    if (indiceA === indiceB) {
        return 0;
    }
    
    return indiceA - indiceB;
}

// Función para expandir un rango (ej: "1-10" -> [1,2,3,4,5,6,7,8,9,10])
function expandirRango(rangoTexto) {
    const partes = rangoTexto.split('-').map(p => p.trim());
    if (partes.length !== 2) return null;
    
    const inicio = parseInt(partes[0]);
    const fin = parseInt(partes[1]);
    
    if (isNaN(inicio) || isNaN(fin) || inicio <= 0 || fin <= 0 || inicio > fin) {
        return null;
    }
    
    const carreras = [];
    for (let i = inicio; i <= fin; i++) {
        carreras.push(i);
    }
    return carreras;
}

// Función para comprimir números consecutivos en rangos (ej: [1,2,3,4,8,9,10,12] -> "1-4,8-10,12")
function comprimirEnRangos(numeros) {
    if (numeros.length === 0) return '';
    if (numeros.length === 1) return numeros[0].toString();
    
    const ordenados = [...numeros].sort((a, b) => a - b);
    const rangos = [];
    let inicio = ordenados[0];
    let fin = ordenados[0];
    
    for (let i = 1; i < ordenados.length; i++) {
        if (ordenados[i] === fin + 1) {
            // Es consecutivo, extender el rango
            fin = ordenados[i];
        } else {
            // No es consecutivo, guardar el rango anterior y empezar uno nuevo
            if (inicio === fin) {
                rangos.push(inicio.toString());
            } else {
                rangos.push(`${inicio}-${fin}`);
            }
            inicio = ordenados[i];
            fin = ordenados[i];
        }
    }
    
    // Agregar el último rango
    if (inicio === fin) {
        rangos.push(inicio.toString());
    } else {
        rangos.push(`${inicio}-${fin}`);
    }
    
    return rangos.join(',');
}

// Función para validar y formatear las carreras
function formatearCarreras(carrerasTexto) {
    const textoLimpio = carrerasTexto.trim().toLowerCase();
    const textoOriginal = carrerasTexto.trim();
    
    // Si es "all", devolver "ALL"
    if (textoLimpio === 'all') {
        return 'ALL';
    }
    
    // Dividir por comas y procesar cada parte
    const partes = textoOriginal.split(',')
        .map(c => c.trim())
        .filter(c => c !== '');
    
    // Verificar si alguna parte es "all"
    const tieneAll = partes.some(p => p.toLowerCase() === 'all');
    if (tieneAll) {
        return 'ALL';
    }
    
    // Si es un solo rango (ej: "1-10"), mantenerlo como está
    if (partes.length === 1 && partes[0].includes('-')) {
        const rangoExpandido = expandirRango(partes[0]);
        if (rangoExpandido && rangoExpandido.length > 0) {
            // Validar que el rango sea válido, pero devolver el formato original
            return partes[0];
        }
    }
    
    // Para múltiples partes o números individuales, expandir y comprimir
    const carreras = [];
    
    for (const parte of partes) {
        // Verificar si es un rango (contiene "-")
        if (parte.includes('-')) {
            const rangoExpandido = expandirRango(parte);
            if (rangoExpandido) {
                carreras.push(...rangoExpandido);
            }
        } else {
            // Es un número individual
            const numero = parseInt(parte);
            if (!isNaN(numero) && numero > 0) {
                carreras.push(numero);
            }
        }
    }
    
    // Si no hay carreras válidas, retornar string vacío
    if (carreras.length === 0) {
        return '';
    }
    
    // Eliminar duplicados y comprimir en rangos
    const carrerasUnicas = [...new Set(carreras)];
    return comprimirEnRangos(carrerasUnicas);
}

// Función para convertir string de carreras a array de números
function carrerasAArray(carrerasTexto) {
    if (carrerasTexto.toUpperCase() === 'ALL') {
        return 'ALL'; // Retornar como string especial
    }
    
    return carrerasTexto.split(',')
        .map(c => c.trim())
        .map(c => parseInt(c))
        .filter(c => !isNaN(c) && c > 0);
}

// Función para obtener array de números de carreras (para comparación)
// Esta función expande rangos para la lógica interna
function obtenerCarrerasArray(carrerasTexto) {
    if (carrerasTexto.toUpperCase() === 'ALL') {
        return 'ALL';
    }
    
    const partes = carrerasTexto.split(',')
        .map(c => c.trim())
        .filter(c => c !== '');
    
    const carreras = [];
    
    for (const parte of partes) {
        // Verificar si es un rango (contiene "-")
        if (parte.includes('-')) {
            const rangoExpandido = expandirRango(parte);
            if (rangoExpandido) {
                carreras.push(...rangoExpandido);
            }
        } else {
            // Es un número individual
            const numero = parseInt(parte);
            if (!isNaN(numero) && numero > 0) {
                carreras.push(numero);
            }
        }
    }
    
    // Eliminar duplicados y ordenar
    const carrerasUnicas = [...new Set(carreras)];
    return carrerasUnicas.sort((a, b) => a - b);
}

// Función para verificar si hay intersección entre dos conjuntos de carreras
function hayInterseccionCarreras(carreras1, carreras2) {
    // Si alguna es "ALL", siempre hay intersección
    if (carreras1.toUpperCase() === 'ALL' || carreras2.toUpperCase() === 'ALL') {
        return true;
    }
    
    const arr1 = obtenerCarrerasArray(carreras1);
    const arr2 = obtenerCarrerasArray(carreras2);
    
    // Si alguno es "ALL", retornar true
    if (arr1 === 'ALL' || arr2 === 'ALL') {
        return true;
    }
    
    // Verificar si hay intersección
    return arr1.some(c => arr2.includes(c));
}

// Función para obtener las carreras en común entre dos conjuntos
function obtenerCarrerasEnComun(carreras1, carreras2) {
    if (carreras1.toUpperCase() === 'ALL' || carreras2.toUpperCase() === 'ALL') {
        return carreras2.toUpperCase() === 'ALL' ? carreras1 : carreras2;
    }
    
    const arr1 = obtenerCarrerasArray(carreras1);
    const arr2 = obtenerCarrerasArray(carreras2);
    
    if (arr1 === 'ALL' || arr2 === 'ALL') {
        return arr1 === 'ALL' ? carreras2 : carreras1;
    }
    
    const comunes = arr1.filter(c => arr2.includes(c));
    return comunes.length > 0 ? comunes.join(', ') : null;
}

// Función para validar que no exista una apuesta del mismo tipo en las mismas carreras con diferente monto
function validarApuestaUnica(tipo, monto, carreras) {
    for (const apuesta of apuestas) {
        // Si es el mismo tipo pero diferente monto
        if (apuesta.tipo === tipo && apuesta.monto !== monto) {
            // Verificar si hay intersección en las carreras
            if (hayInterseccionCarreras(apuesta.carreras, carreras)) {
                const carrerasComunes = obtenerCarrerasEnComun(apuesta.carreras, carreras);
                let mensajeCarreras;
                
                if (carrerasComunes) {
                    if (typeof carrerasComunes === 'string' && carrerasComunes.toUpperCase() === 'ALL') {
                        mensajeCarreras = 'todas las carreras';
                    } else {
                        mensajeCarreras = `la(s) carrera(s): ${carrerasComunes}`;
                    }
                } else {
                    mensajeCarreras = 'alguna de las carreras especificadas';
                }
                
                return {
                    valida: false,
                    mensaje: `¡ALERTA!\n\nYa existe una apuesta ${formatearTipoApuesta(tipo)} con monto $${apuesta.monto.toFixed(2)} en ${mensajeCarreras}.\n\nNo puedes tener la misma apuesta con diferente monto en la misma carrera.\n\nApuesta existente: ${formatearTipoApuesta(tipo)} - $${apuesta.monto.toFixed(2)} - Carreras: ${apuesta.carreras}\nApuesta intentada: ${formatearTipoApuesta(tipo)} - $${monto.toFixed(2)} - Carreras: ${carreras}`
                };
            }
        }
    }
    return { valida: true };
}

// Función para combinar carreras de dos strings, eliminando duplicados
function combinarCarreras(carreras1, carreras2) {
    // Si alguna es "ALL", el resultado es "ALL"
    if (carreras1.toUpperCase() === 'ALL' || carreras2.toUpperCase() === 'ALL') {
        return 'ALL';
    }
    
    // Convertir ambos strings a arrays de números (expandir rangos)
    const arr1 = obtenerCarrerasArray(carreras1);
    const arr2 = obtenerCarrerasArray(carreras2);
    
    // Si alguno es "ALL", retornar "ALL"
    if (arr1 === 'ALL' || arr2 === 'ALL') {
        return 'ALL';
    }
    
    // Combinar y eliminar duplicados usando Set
    const carrerasCombinadas = [...new Set([...arr1, ...arr2])];
    
    // Comprimir en rangos y retornar
    return comprimirEnRangos(carrerasCombinadas);
}

// Función para agregar una apuesta a la tabla
function agregarApuestaATabla(apuesta, index) {
    const fila = document.createElement('tr');
    
    // Marcar visualmente la última apuesta agregada/modificada
    if (apuesta.id && apuesta.id === ultimaApuestaId) {
        fila.classList.add('ultima-apuesta');
    }
    
    fila.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${formatearTipoApuesta(apuesta.tipo)}</strong></td>
        <td>$${apuesta.monto.toFixed(2)}</td>
        <td>${apuesta.carreras}</td>
        <td>
            <button class="btn-eliminar" onclick="eliminarApuesta(${index})">
                Eliminar
            </button>
        </td>
    `;
    
    tablaBody.appendChild(fila);
    actualizarMensajeVacio();
}

// Función para actualizar la tabla completa
function actualizarTabla() {
    tablaBody.innerHTML = '';
    
    if (apuestas.length === 0) {
        actualizarMensajeVacio();
        return;
    }
    
    // Ordenar apuestas según el orden personalizado
    const apuestasOrdenadas = [...apuestas].sort(compararApuestas);
    
    apuestasOrdenadas.forEach((apuesta, index) => {
        agregarApuestaATabla(apuesta, index);
    });
}

// Función para actualizar el mensaje de tabla vacía
function actualizarMensajeVacio() {
    if (apuestas.length === 0) {
        mensajeVacio.classList.add('mostrar');
    } else {
        mensajeVacio.classList.remove('mostrar');
    }
}

// Función para limpiar el formulario
function limpiarFormulario() {
    carrerasInput.value = '';
    tipoApuestaSelect.value = '';
    montoInput.value = '';
    carrerasInput.focus();
}

// Cargar apuestas guardadas del localStorage al cargar la página
function cargarApuestasGuardadas() {
    const apuestasGuardadas = localStorage.getItem('apuestas');
    if (apuestasGuardadas) {
        try {
            apuestas = JSON.parse(apuestasGuardadas);
            // Ordenar apuestas según el orden personalizado al cargar
            apuestas.sort(compararApuestas);
            guardarApuestas(); // Guardar el orden
            actualizarTabla();
        } catch (e) {
            console.error('Error al cargar apuestas guardadas:', e);
        }
    }
}

// Guardar apuestas en localStorage cada vez que se agregue o elimine una
function guardarApuestas() {
    localStorage.setItem('apuestas', JSON.stringify(apuestas));
}

// Función para eliminar una apuesta
window.eliminarApuesta = function(index) {
    if (confirm('¿Estás seguro de que deseas eliminar esta apuesta?')) {
        // Ordenar antes de eliminar para que el índice coincida
        apuestas.sort(compararApuestas);
        
        apuestas.splice(index, 1);
        guardarApuestas();
        actualizarTabla();
    }
};

// Event listener para el formulario
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const tipo = tipoApuestaSelect.value;
    const monto = parseFloat(montoInput.value);
    const carrerasTexto = carrerasInput.value.trim();
    
    // Validaciones
    if (!tipo) {
        alert('Por favor, selecciona un tipo de apuesta.');
        return;
    }
    
    if (!monto || monto <= 0) {
        alert('Por favor, ingresa un monto válido mayor a 0.');
        montoInput.focus();
        return;
    }
    
    if (!carrerasTexto) {
        alert('Por favor, ingresa al menos una carrera.');
        carrerasInput.focus();
        return;
    }
    
    // Formatear carreras
    const carrerasFormateadas = formatearCarreras(carrerasTexto);
    
    if (carrerasFormateadas === '') {
        alert('Por favor, ingresa carreras válidas.\nEjemplos: "1,2,3" o "1-10" o "all"');
        carrerasInput.focus();
        return;
    }
    
    // Validar que no exista una apuesta del mismo tipo en las mismas carreras con diferente monto
    const validacion = validarApuestaUnica(tipo, monto, carrerasFormateadas);
    if (!validacion.valida) {
        alert(validacion.mensaje);
        carrerasInput.focus();
        return;
    }
    
    // Buscar si ya existe una apuesta con el mismo tipo y monto
    const apuestaExistente = apuestas.findIndex(ap => 
        ap.tipo === tipo && ap.monto === monto
    );
    
    if (apuestaExistente !== -1) {
        // Si existe, combinar las carreras
        const carrerasCombinadas = combinarCarreras(
            apuestas[apuestaExistente].carreras,
            carrerasFormateadas
        );
        apuestas[apuestaExistente].carreras = carrerasCombinadas;
        
        // Asegurarnos de que tenga un ID (por si viene de datos antiguos sin ID)
        if (!apuestas[apuestaExistente].id) {
            apuestas[apuestaExistente].id = Date.now();
        }
        // Registrar esta apuesta como la última modificada
        ultimaApuestaId = apuestas[apuestaExistente].id;
    } else {
        // Si no existe, crear nueva apuesta
        const nuevaApuesta = {
            tipo: tipo,
            monto: monto,
            carreras: carrerasFormateadas,
            // ID único para poder identificar la última apuesta
            id: Date.now()
        };
        apuestas.push(nuevaApuesta);
        // Registrar esta nueva apuesta como la última agregada
        ultimaApuestaId = nuevaApuesta.id;
    }
    
    // Ordenar apuestas según el orden personalizado antes de guardar
    apuestas.sort(compararApuestas);
    
    // Guardar en localStorage
    guardarApuestas();
    
    // Actualizar tabla
    actualizarTabla();
    
    // Limpiar formulario
    limpiarFormulario();
});

// Función para eliminar todas las apuestas
window.eliminarTodo = function() {
    if (apuestas.length === 0) {
        alert('No hay apuestas para eliminar.');
        return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar TODAS las apuestas? Esta acción no se puede deshacer.')) {
        apuestas = [];
        guardarApuestas();
        actualizarTabla();
        alert('Todas las apuestas han sido eliminadas.');
    }
};

// Función para exportar a PDF
window.exportarAPDF = function() {
    if (apuestas.length === 0) {
        alert('No hay apuestas para exportar.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Ordenar apuestas según el orden personalizado para el PDF
    const apuestasOrdenadas = [...apuestas].sort(compararApuestas);
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(1, 84, 64); // #015440
    doc.text('Minimos Especiales', 14, 20);
    
    // Fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Fecha: ${fecha}`, 14, 30);
    
    // Preparar datos para la tabla
    const datos = apuestasOrdenadas.map((apuesta) => [
        apuesta.carreras,
        formatearTipoApuesta(apuesta.tipo),
        `$${apuesta.monto.toFixed(2)}`
    ]);
    
    // Calcular el ancho máximo necesario para la columna de carreras
    doc.setFontSize(12);
    let maxCarrerasWidth = doc.getTextWidth('Carreras'); // Ancho del encabezado
    apuestasOrdenadas.forEach((apuesta) => {
        const width = doc.getTextWidth(apuesta.carreras);
        if (width > maxCarrerasWidth) {
            maxCarrerasWidth = width;
        }
    });
    // Agregar padding generoso (aproximadamente 12mm para padding izquierdo y derecho)
    // para asegurar que el contenido no se divida en múltiples líneas
    const anchoCarreras = Math.max(maxCarrerasWidth + 12, 40);
    
    // Crear tabla
    doc.autoTable({
        startY: 40,
        head: [['Carreras', 'Tipo de Apuesta', 'Monto']],
        body: datos,
        theme: 'striped',
        headStyles: {
            fillColor: [1, 84, 64], // #015440
            textColor: 255,
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
        },
        styles: {
            fontSize: 12,
            cellPadding: 2,
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { 
                cellWidth: anchoCarreras, 
                halign: 'left'
            },
            1: { cellWidth: 40, halign: 'left' },
            2: { cellWidth: 40, halign: 'left' }
        },
        didParseCell: function(data) {
            // Para la columna de carreras (columna 0), asegurar que el ancho sea suficiente
            // y evitar el linebreak forzando el ancho calculado
            if (data.column.index === 0) {
                data.cell.styles.cellWidth = anchoCarreras;
                // Desactivar el linebreak estableciendo un ancho mínimo muy grande
                if (data.cell.text && data.cell.text.length > 0) {
                    data.cell.styles.minCellWidth = anchoCarreras;
                }
            }
        }
    });
    
    // Mostrar solo el total de apuestas (sin monto total)
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de Apuestas: ${apuestas.length}`, 14, finalY);
    
    // Guardar PDF
    const nombreArchivo = `Apuestas_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
};

// Cargar apuestas al iniciar
cargarApuestasGuardadas();




///funcion para que david no pague 2 veces la reserva 

const david = function(){
    let reserva = true
    let pago =true 
    let colo = cancela 

    if(david == pago){
        console.log("ya no paga mas ")
    }
    return colo 
}
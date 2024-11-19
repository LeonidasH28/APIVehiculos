const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json()); 

// Función para leer datos 
const leerDatos = () => {
    try {
        const datos = fs.readFileSync("./datos.json", "utf8");
        return JSON.parse(datos);
    } catch (error) {
        console.error("Error al leer los datos:", error);
        return {};
    }
};

// Función para escribir datos 
const escribirDatos = (datos) => {
    try {
        fs.writeFileSync("./datos.json", JSON.stringify(datos, null, 2));
    } catch (error) {
        console.error("Error al escribir los datos:", error);
    }
};

// Ruta principal para comprobar si el servidor está en funcionando
app.get('/', (req, res) => {
    res.send("API escuchando en el puerto " + port);
});

/** Vehículos */

// Listar todos los vehículos
app.get('/ListarVehiculos', (req, res) => {
    const datos = leerDatos();
    res.json(datos.vehiculos || []);
});

// Buscar un vehículo por ID
app.get('/BuscarVehiculo/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const vehiculo = datos.vehiculos?.find(v => v.id === id);
    if (vehiculo) {
        res.json(vehiculo);
    } else {
        res.status(404).send("Vehículo no encontrado.");
    }
});

// Buscar vehículos por estado (activo, inactivo, etc.)
app.get('/BuscarVehiculosPorEstado/:estado', (req, res) => {
    const datos = leerDatos();
    const estado = req.params.estado;
    const vehiculosPorEstado = datos.vehiculos?.filter(v => v.estado.toLowerCase() === estado.toLowerCase());

    if (vehiculosPorEstado && vehiculosPorEstado.length > 0) {
        res.json(vehiculosPorEstado);
    } else {
        res.status(404).json({ message: `No se encontraron vehículos con el estado: ${estado}.` });
    }
});

// Registrar un nuevo vehículo
app.post('/SubirVehiculo', (req, res) => {
    const datos = leerDatos();
    const nuevoVehiculo = {
        id: datos.vehiculos.length + 1, // Generar un nuevo ID automáticamente
        ...req.body,
        estado: "activo" // Asignar estado inicial
    };
    datos.vehiculos.push(nuevoVehiculo);
    escribirDatos(datos);
    res.json(nuevoVehiculo);
});

// Actualizar información de un vehículo
app.put('/ActualizarVehiculo/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const vehiculoIndex = datos.vehiculos.findIndex(v => v.id === id);
    if (vehiculoIndex !== -1) {
        datos.vehiculos[vehiculoIndex] = { ...datos.vehiculos[vehiculoIndex], ...req.body };
        escribirDatos(datos);
        res.json({ message: "Vehículo actualizado" });
    } else {
        res.status(404).send("Vehículo no encontrado.");
    }
});

// Cambiar el estado de un vehículo (activo, inactivo, en reparación)
app.delete('/EstadoVehiculo/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const { estado } = req.body; // Nuevo estado cambiado por la solicitud

    const vehiculo = datos.vehiculos.find(v => v.id === id);
    
    if (!vehiculo) return res.status(404).json({ message: "Vehículo no encontrado." });

    if (estado !== "activo" && estado !== "inactivo" && estado !== "En reparación") {
        return res.status(400).json({ message: "Estado inválido. Debe ser 'activo', 'inactivo' o 'En reparación'." });
    }

    vehiculo.estado = estado;
    escribirDatos(datos);

    res.json({ message: `Estado del vehículo cambiado a ${estado}.`, vehiculo });
});

/** Mantenimiento */

// Listar todas las órdenes de mantenimiento
app.get('/ListarMantenimientos', (req, res) => {
    const datos = leerDatos();
    res.json(datos.mantenimiento || []);
});

// Registrar una nueva orden de mantenimiento
app.post('/SubirMantenimiento', (req, res) => {
    const datos = leerDatos();
    const nuevoId = datos.mantenimiento.length > 0 ? datos.mantenimiento[datos.mantenimiento.length - 1].id + 1 : 1;
    const nuevaOrden = {
        id: nuevoId,
        ...req.body,
        estado: "inactivo" // Estado inicial de la orden
    };

    // Verificar si el vehículo existe y está activo
    const vehiculo = datos.vehiculos.find(v => v.id === nuevaOrden.idVehiculo);
    if (!vehiculo) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    if (vehiculo.estado !== "activo") {
        return res.status(400).json({ message: "El vehículo no está activo y no se puede registrar en mantenimiento." });
    }

    vehiculo.estado = "En mantenimiento"; // Cambiar estado del vehículo
    datos.mantenimiento.push(nuevaOrden);
    escribirDatos(datos);

    res.json({ message: "Orden de mantenimiento registrada", orden: nuevaOrden });
});

// Cambiar el estado de una orden de mantenimiento
app.delete('/EstadoMantenimiento/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const mantenimiento = datos.mantenimiento.find(m => m.id === id);

    if (!mantenimiento) {
        return res.status(404).json({ message: "Mantenimiento no encontrado." });
    }

    mantenimiento.estado = mantenimiento.estado === "activo" ? "inactivo" : "activo";
    escribirDatos(datos);

    res.json({ message: `Estado del mantenimiento cambiado a ${mantenimiento.estado}.`, mantenimiento });
}); // se cambia el estado de activo a inactivo i viceversa

// Endpoint para buscar mantenimiento por ID
app.get('/Buscarmantenimiento/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id); 

    // Buscar el mantenimiento por ID
    const mantenimiento = datos.mantenimiento?.find(m => m.id === id);

    if (mantenimiento) {
        res.json(mantenimiento);
    } else {
        res.status(404).json({ message: "Mantenimiento no encontrado." });
    }
});
app.get('/Buscarmantenimiento/proveedor/:nombreProveedor', (req, res) => {
    const datos = leerDatos();
    const nombreProveedor = req.params.nombreProveedor.toLowerCase();
r
    const mantenimientosFiltrados = datos.mantenimiento?.filter(m => m.proveedor.toLowerCase() === nombreProveedor);//filtrar por nombre del proveedor

    if (mantenimientosFiltrados && mantenimientosFiltrados.length > 0) {
        res.json(mantenimientosFiltrados);
    } else {
        res.status(404).json({ message: "No se encontraron mantenimientos para el proveedor especificado." });
    }
});

// Proveedores
app.get('/ListarProveedores', (req, res) => {
    const datos = leerDatos();
    res.json(datos.proveedores || []);
});//listar todos los proveedores

app.get('/BuscarProveedorPorNombre/:nombre', (req, res) => {
    const datos = leerDatos();
    const nombre = req.params.nombre.toLowerCase();
    const proveedores = datos.proveedores?.filter(p => p.nombre.toLowerCase().includes(nombre));

    if (proveedores && proveedores.length > 0) {
        res.json(proveedores);
    } else {
        res.status(404).json({ message: "Proveedor no encontrado." });
    }
});

app.get('/BuscarProveedorPorId/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const proveedor = datos.proveedores.find(p => p.id === id);

    if (proveedor) {
        res.json(proveedor);
    } else {
        res.status(404).json({ message: "Proveedor no encontrado." });
    }
});

app.put('/ActualizarServiciosProveedor/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const { servicios } = req.body;
    const proveedor = datos.proveedores.find(p => p.id === id);

    if (!proveedor) return res.status(404).json({ message: "Proveedor no encontrado." });
    
    proveedor.servicios = servicios;
    escribirDatos(datos);
    res.json({ message: "Servicios del proveedor actualizados.", proveedor });
});
app.post('/SubirProveedor', (req, res) => {
    const datos = leerDatos();


    const nuevoId = datos.proveedores.length > 0 ? datos.proveedores[datos.proveedores.length - 1].id + 1 : 1;// se crea un id con un numero mas al anterior

   
    const nuevoProveedor = {
        id: nuevoId,
        ...req.body  
    };

    
    datos.proveedores.push(nuevoProveedor);

    
    escribirDatos(datos);

    
    res.status(201).json({ message: "Proveedor registrado", proveedor: nuevoProveedor });
});

// Conductores
app.get('/ListarConductores', (req, res) => {
    const datos = leerDatos();
    res.json(datos.conductores || []);
});

app.get('/BuscarConductorPorId/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const conductor = datos.conductores.find(c => c.id === id);

    if (conductor) {
        res.json(conductor);
    } else {
        res.status(404).json({ message: "Conductor no encontrado." });
    }
});
// nuevo conductor
app.post('/SubirConductor', (req, res) => {
    const datos = leerDatos();

    const nuevoId = datos.conductores.length > 0 ? datos.conductores[datos.conductores.length - 1].id + 1 : 1;

    
    const nuevoConductor = {
        id: nuevoId,
        ...req.body 
    };

    datos.conductores.push(nuevoConductor);

    escribirDatos(datos);


    res.status(201).json({ message: "Conductor registrado", conductor: nuevoConductor });
});
//cambiar datos de clientes
app.put('/ActualizarCliente/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id); 
    const clienteIndex = datos.clientes.findIndex(c => c.id === id); 
    if (clienteIndex !== -1) {
        // Actualizar los datos del cliente
        datos.clientes[clienteIndex] = { ...datos.clientes[clienteIndex], ...req.body };
        escribirDatos(datos); 
        res.json({ message: "Cliente actualizado" }); 
    } else {
        res.status(404).send("Cliente no encontrado."); // Responder con un error si no se encuentra el cliente
    }
}); 
// Reservas
app.get('/ListarReservas', (req, res) => {
    const datos = leerDatos();
    res.json(datos.reservas || []);
});

app.get('/BuscarReserva/:id', (req, res) => {
    const datos = leerDatos();
    const id = parseInt(req.params.id);
    const reserva = datos.reservas.find(r => r.id === id);

    if (reserva) {
        res.json(reserva);
    } else {
        res.status(404).json({ message: "Reserva no encontrada." });
    }
});
app.delete('/eliminarReserva/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const datos = leerDatos();

    const reservaIndex = datos.reservas.findIndex(reserva => reserva.id === id);

    if (reservaIndex === -1) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    // En lugar de eliminar, cambiamos el estado a "inactivo"
    datos.reservas[reservaIndex].estado = 'inactivo';

    escribirDatos(datos);
    res.json({ message: 'Reserva marcada como inactiva' });
});

app.post('/SubirReserva', (req, res) => {
    const datos = leerDatos(); 

    // Asignar un nuevo ID automáticamente
    const nuevoId = datos.reservas.length > 0 ? datos.reservas[datos.reservas.length - 1].id + 1 : 1;

    
    const nuevaReserva = {
        id: nuevoId,
        ...req.body  // Asignar los datos del cuerpo de la solicitud
    };

  
    datos.reservas.push(nuevaReserva);

   
    escribirDatos(datos);

    
    res.status(201).json({ message: "Reserva registrada", reserva: nuevaReserva });
});
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

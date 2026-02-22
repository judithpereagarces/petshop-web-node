const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    res.render('home');
});

router.get('/servicios', (req, res) => {
    res.render('servicios');
});

router.get('/contacto', (req, res) => {
    res.render('contacto');
});

router.get('/tienda', (req, res) => {

    const categoria = req.query.categoria;

    res.render('tienda', { categoria });

});

router.get('/turno', (req, res) => {
    res.render('turno');
});

// Procesar formulario de turno
router.post('/turno', async (req, res) => {

    const { nombre_dueno, nombre_mascota, servicio, fecha, horario, email, whatsapp } = req.body;

    const fechaSeleccionada = new Date(fecha);
    const diaSemana = fechaSeleccionada.getDay();

    if (diaSemana === 0 || diaSemana === 6) {
        return res.send("❌ Solo trabajamos de lunes a viernes. Elegí una fecha válida.");
    }

    try {

        const [existe] = await db.query(
            "SELECT * FROM turnos WHERE fecha = ? AND horario = ?",
            [fecha, horario]
        );

        if (existe.length > 0) {
            return res.send("❌ Ese horario ya está reservado. Elegí otro.");
        }

        await db.query(
            "INSERT INTO turnos (nombre_dueno, nombre_mascota, servicio, fecha, horario, email, whatsapp) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [nombre_dueno, nombre_mascota, servicio, fecha, horario, email, whatsapp]
        );

        // Configurar transporte
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Enviar mail
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Confirmación de turno - Pet Shop 🐾",
            html: `
                <h2>Turno Confirmado</h2>
                <p><strong>Dueño:</strong> ${nombre_dueno}</p>
                <p><strong>Mascota:</strong> ${nombre_mascota}</p>
                <p><strong>Servicio:</strong> ${servicio}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Horario:</strong> ${horario}</p>
                <br>
                <p>Gracias por confiar en nosotros 🐶</p>
            `
        });

        res.render('confirmacion');

    } catch (error) {
        console.log(error);
        res.send("❌ Error al guardar el turno.");
    }

});

// Mostrar login
router.get('/admin/login', (req, res) => {
    res.render('login');
});


// ADMIN - Ver todos los turnos
router.get('/admin/turnos', async (req, res) => {
if (!req.session.admin) {
    return res.redirect('/admin/login');
}
    try {

        const [turnos] = await db.query("SELECT * FROM turnos ORDER BY fecha, horario");
        const turnosFormateados = turnos.map(turno => {

    const fecha = new Date(turno.fecha);

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    return {
        ...turno,
        fecha: `${dia}/${mes}/${anio}`
    };

});


        res.render('admin_turnos', { turnos: turnosFormateados });


    } catch (error) {
        console.log(error);
        res.send("Error al cargar los turnos.");
    }

});

// ADMIN - Eliminar turno
router.get('/admin/eliminar/:id', async (req, res) => {

    const { id } = req.params;

    try {

        await db.query("DELETE FROM turnos WHERE id = ?", [id]);

        res.redirect('/admin/turnos');

    } catch (error) {
        console.log(error);
        res.send("Error al eliminar turno.");
    }

});
// ADMIN - Mostrar formulario editar
router.get('/admin/editar/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const [turno] = await db.query("SELECT * FROM turnos WHERE id = ?", [id]);

        res.render('editar_turno', { turno: turno[0] });

    } catch (error) {
        console.log(error);
        res.send("Error al cargar turno.");
    }

});
// ADMIN - Actualizar turno
router.post('/admin/editar/:id', async (req, res) => {

    const { id } = req.params;
    const { fecha, horario } = req.body;

    try {

        await db.query(
            "UPDATE turnos SET fecha = ?, horario = ? WHERE id = ?",
            [fecha, horario, id]
        );

        res.redirect('/admin/turnos');

    } catch (error) {
        console.log(error);
        res.send("Error al actualizar turno.");
    }

});

// Procesar login
router.post('/admin/login', (req, res) => {

    const { usuario, password } = req.body;

    // Usuario y contraseña fija para el TP
    if (usuario === "admin" && password === "1234") {

        req.session.admin = true;
        return res.redirect('/admin/turnos');

    } else {
        return res.send("Credenciales incorrectas");
    }

});

// Logout
router.get('/admin/logout', (req, res) => {

    req.session.destroy(() => {
        res.redirect('/admin/login');
    });

});

module.exports = router;

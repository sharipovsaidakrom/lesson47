const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({extended: true}))

const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json')));
const payments = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/payments.json')));
const course_read = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/courses.json')));

const checkUser = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = users.find(item => item.username === username)

    if (!username || !password) {
        req.error = 'Login yoki parol yuborilmagan';
        next();
        return
    }

    if (!user) {
        req.error = 'Ushbu foydalanuvchi topilmadi!';
        next();
        return
    }

    if (user.password !== password) {
        req.error = 'Parol xato!';
        next();
        return
    }
    next()
}

app.engine('hbs', engine({
    extname: 'hbs',
})); // .hbs larni render qilish uchun

app.set('view engine', 'hbs'); // .hbs yozmasa ham hbs ishlasin

app.use(session({
    secret: "123123",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}));

const checkLogin = (req, res, next) => {
    if (!req.session.authorized) {
        res.redirect('/login');
        return;
    }
    const user = users.find(item => item.username === req.session.username)
    if (!user) {
        res.redirect('/login');
        return;
    }

    next();
}

app.get('/', checkLogin, (req, res) => {
    res.render('home', {
        isActive1: 'active',
        isActive2: '',
        isActive3: '',
        isActive4: ''
    })
})
app.get('/home', checkLogin, (req, res) => {
    res.render('home', {
        isActive1: 'active',
        isActive2: '',
        isActive3: '',
        isActive4: ''
    });
})
app.get('/groups', checkLogin, (req, res) => {
    res.render('groups', {
        isActive1: '',
        isActive2: 'active',
        isActive3: '',
        isActive4: ''
    });
})
app.get('/payments(/index)?', checkLogin, (req, res) => {
    res.render('payments/index', {
        isActive1: '',
        isActive2: '',
        isActive3: '',
        isActive4: 'active',
        payments: payments,
        helpers: {
            userName(data) {
                let { id, name } = data.hash;
                const user = users.find(item => item.id === id);
                return (user) ? user.full_name : "Noma'lum o'quvchi";
            },
            amountWithType(data) {
                let { type, amount } = data.hash;
                return (type === 'credit' ? '-' : '+') + amount;
            },
            formattedDate(timestamp) {
                const date = new Date(timestamp * 1000);
                return date.toLocaleDateString();
            },
        },
    });
})

app.get('/payments/add', checkLogin, (req, res) => {
    res.render('payments/add')
    // console.log(req.body);
})

app.post('/payments/add', checkLogin, (req, res) => {
    const newId = payments[payments.length - 1].id + 1
    const newPayment = Object.assign(
        {
            id: newId,
            user_id: req.body.student_id,
            type: "debit",
            amount: req.body.amount,
            created_at: 1690466000,
            comment: req.body.comment
        }, req.body)

    payments.push(newPayment)

    fs.writeFile(path.join(__dirname, 'data', 'payments.json'), JSON.stringify(payments), (err) => {
        res.status(200).json({
            status: true,
            data: {
                payments: newPayment
            }
        })
    })

    res.redirect('/payments')
})

app.get('/logout', (req, res) => {
    if (req.session.authorized) {
        delete req.session.authorized;
        delete req.session.username;
    }
    res.redirect('/login');
})

app.get('/login', (req, res) => {
    if (req.session.authorized) {
        res.redirect('/');
        return;
    }

    res.render('login', {
        title: "Kirish",
        layout: 'login',
        error: req.session.error
    });
    delete req.session.error;
})
// app.use(express.urlencoded({ extended: true }));

app.post('/login', checkUser, (req, res) => {
    if (req.error) {
        req.session.error = req.error;
        res.redirect('/login');
        return;
    }

    req.session.authorized = true;
    req.session.username = req.body.username;
    res.redirect('/');
    return
})

app.get('/courses', checkUser, (req, res) => {
    res.render('courses/index', {
        isActive1: '',
        isActive2: '',
        isActive3: 'active',
        isActive4: '',
        courses: course_read
    });
})

// const course_read = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/courses.json')));

app.get('/courses/add', (req, res) => {
    res.render('courses/add', {
        isActive1: '',
        isActive2: '',
        isActive3: 'active',
        isActive4: ''
    })
})

app.post('/courses/add', checkUser, (req, res) => {
    const newId = course_read.length + 1
    console.log(newId);
    const newCourse = {
           id: newId,
           user_id: req.body.student_id,
           kurs_nomi: req.body.kurs_nomi,
           created_at: new Date().getDate,
           comment: req.body.comment
    }
    course_read.push(newCourse)

    fs.writeFileSync(path.join(__dirname, 'data', 'courses.json'), JSON.stringify(course_read))

    res.redirect('/courses')
})

app.get('/courses/edit', checkUser, (req, res) => {
    res.render('courses/edit', {
        isActive1: '',
        isActive2: '',
        isActive3: 'active',
        isActive4: ''
    });
})

app.get('/courses/delete', checkUser, (req, res) => {
    res.render('courses/delete', {
        isActive1: '',
        isActive2: '',
        isActive3: 'active',
        isActive4: ''
    });
})

app.listen(5555, () => {
    console.log("Sayt http://localhost:5555 linkida ishga tushdi");
})
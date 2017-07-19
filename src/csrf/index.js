const r = require('../db');
const crypto = require('crypto');

const make = (req, res, next) => {
	const csrf = crypto.randomBytes(64).toString('hex');
	if (req.user && req.user.id) {
		r.table('csrf')
			.insert({
				id: req.user.id,
				expiry: Date.now() + 900,
				csrf
			}, {
				conflict: 'replace'
			})
			.run(r.conn, (err) => {
				if (err) {
					res.status(500).render('error.html', { user: req.user, status: 500, message: 'An error occured with the Rethonk DB server.' });
				} else {
					req.csrf = csrf;
					next();
				}
			});
	} else {
		res.redirect('/auth');
	}
};

const check = (req, res, next) => {
	if (req.user && req.user.id) {
		r.table('csrf')
			.get(req.user.id)
			.run(r.conn, (err, result) => {
				if (err) {
					res.status(500).render('error.html', { user: req.user, status: 500, message: 'An error occured with the Rethonk DB server.' });
				} else if (result.csrf !== req.body.csrf && result.expiry < Date.now()) {
					res.status(401).render('error.html', { user: req.user, status: 500, message: 'A CSRF error occured. Did your form expire?' });
				} else {
					next();
				}
			});
	} else {
		res.status(403).render('error.html', { user: req.user, status: 403, message: 'You are not authenticated' });
	}
};

module.exports.make = make;
module.exports.check = check;
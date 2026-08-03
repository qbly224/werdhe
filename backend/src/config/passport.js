const passport      = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db            = require('../database');
const jwt           = require('jsonwebtoken');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
},
async function(accessToken, refreshToken, profile, done) {
  try {
    var email   = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    var prenom  = profile.name ? profile.name.givenName  : '';
    var nom     = profile.name ? profile.name.familyName : '';
    var googleId = profile.id;

    if (!email) return done(null, false, { message: 'Email Google non disponible' });

    // Chercher l'utilisateur par email ou google_id
    var existing = await db.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email, googleId]
    );

    var user;

    if (existing.rows.length > 0) {
      user = existing.rows[0];
      // Mettre à jour le google_id si pas encore fait
      if (!user.google_id) {
        await db.query(
          'UPDATE users SET google_id = $1 WHERE id = $2',
          [googleId, user.id]
        );
      }
    } else {
      // Créer un nouveau compte
      var result = await db.query(
        `INSERT INTO users
           (email, prenom, nom, google_id, role, mot_de_passe)
         VALUES ($1, $2, $3, $4, 'locataire', $5)
         RETURNING *`,
        [email, prenom, nom, googleId, 'google_oauth_' + googleId]
      );
      user = result.rows[0];
    }

    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser(function(user, done) { done(null, user.id); });
passport.deserializeUser(async function(id, done) {
  try {
    var result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) { done(err, null); }
});

module.exports = passport;
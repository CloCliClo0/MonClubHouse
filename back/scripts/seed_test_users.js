'use strict';

/**
 * Seed : création des utilisateurs de test
 *
 * Usage :
 *   node back/scripts/seed_test_users.js
 *   node back/scripts/seed_test_users.js --club 2       (autre club_id)
 *   node back/scripts/seed_test_users.js --delete       (supprime les comptes de test)
 *
 * Mot de passe généré pour tous les comptes : Test1234
 */

const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = require('../config/db');
const User      = require('../models/User');

// ─── Configuration ───────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const DELETE  = args.includes('--delete');
const clubArg = args.indexOf('--club');
const CLUB_ID = clubArg !== -1 ? parseInt(args[clubArg + 1]) : 1;
const PASSWORD = 'Test1234';

// ─── Liste des joueurs ────────────────────────────────────────────────────────

const PLAYERS = [
  { prenom: 'Amaury',       nom: 'Test',    email: 'amaury@clubtest.fr'       },
  { prenom: 'Lucas',        nom: 'Test',    email: 'lucas@clubtest.fr'        },
  { prenom: 'Pierre',       nom: 'Test',    email: 'pierre@clubtest.fr'       },
  { prenom: 'Tybo',         nom: 'Test',    email: 'tybo@clubtest.fr'         },
  { prenom: 'Andy',         nom: 'Test',    email: 'andy@clubtest.fr'         },
  { prenom: 'Arthur',       nom: 'Test',    email: 'arthur@clubtest.fr'       },
  { prenom: 'Albert',       nom: 'Test',    email: 'albert@clubtest.fr'       },
  { prenom: 'Victor',       nom: 'Test',    email: 'victor@clubtest.fr'       },
  { prenom: 'Maxime',       nom: 'Test',    email: 'maxime@clubtest.fr'       },
  { prenom: 'Flo',          nom: 'H.',      email: 'flo.h@clubtest.fr'        },
  { prenom: 'Rémi',         nom: 'Test',    email: 'remi@clubtest.fr'         },
  { prenom: 'Julien',       nom: 'H.',      email: 'julien.h@clubtest.fr'     },
  { prenom: 'Julien',       nom: 'P.',      email: 'julien.p@clubtest.fr'     },
  { prenom: 'Paul',         nom: 'Test',    email: 'paul@clubtest.fr'         },
  { prenom: 'Mathis',       nom: 'Test',    email: 'mathis@clubtest.fr'       },
  { prenom: 'Loïc',         nom: 'Test',    email: 'loic@clubtest.fr'         },
  { prenom: 'Martin',       nom: 'Test',    email: 'martin@clubtest.fr'       },
  { prenom: 'Théo',         nom: 'R.',      email: 'theo.r@clubtest.fr'       },
  { prenom: 'Clément',      nom: 'S.',      email: 'clement.s@clubtest.fr'    },
  { prenom: 'Nico',         nom: 'Test',    email: 'nico@clubtest.fr'         },
  { prenom: 'Mathieu',      nom: 'Test',    email: 'mathieu@clubtest.fr'      },
  { prenom: 'Batiste',      nom: 'Test',    email: 'batiste@clubtest.fr'      },
  { prenom: 'Charles',      nom: 'Test',    email: 'charles@clubtest.fr'      },
  { prenom: 'Thomas',       nom: 'Test',    email: 'thomas@clubtest.fr'       },
  { prenom: 'Jules',        nom: 'D.',      email: 'jules.d@clubtest.fr'      },
  { prenom: 'Morgan',       nom: 'Test',    email: 'morgan@clubtest.fr'       },
  { prenom: 'Tanguy',       nom: 'Test',    email: 'tanguy@clubtest.fr'       },
  { prenom: 'Théo',         nom: 'L.',      email: 'theo.l@clubtest.fr'       },
  { prenom: 'Louis',        nom: 'Test',    email: 'louis@clubtest.fr'        },
  { prenom: 'Henry',        nom: 'Test',    email: 'henry@clubtest.fr'        },
  { prenom: 'Jules',        nom: 'Test',    email: 'jules@clubtest.fr'        },
  { prenom: 'Marc-Antoine', nom: 'Test',    email: 'marc-antoine@clubtest.fr' },
  { prenom: 'Victor',       nom: 'Test2',   email: 'victor2@clubtest.fr'      },
  { prenom: 'Léo',          nom: 'Test',    email: 'leo@clubtest.fr'          },
  { prenom: 'Clément',      nom: 'D.',      email: 'clement.d@clubtest.fr'    },
  { prenom: 'Eliot',        nom: 'Test',    email: 'eliot@clubtest.fr'        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await sequelize.authenticate();
  console.log(bold('\n══════════════════════════════════════'));
  console.log(bold('   Seed — Utilisateurs de test MCH'));
  console.log(bold('══════════════════════════════════════\n'));

  // Mode suppression
  if (DELETE) {
    const emails = PLAYERS.map(p => p.email);
    const count = await User.destroy({ where: { email: emails } });
    console.log(red(`🗑  ${count} utilisateur(s) de test supprimé(s).`));
    await sequelize.close();
    return;
  }

  console.log(`Club ID   : ${bold(CLUB_ID)}`);
  console.log(`Mot de passe : ${bold(PASSWORD)}`);
  console.log(`Joueurs à insérer : ${bold(PLAYERS.length)}\n`);

  let created = 0, skipped = 0, errors = 0;

  for (const p of PLAYERS) {
    try {
      const exists = await User.findOne({ where: { email: p.email } });
      if (exists) {
        console.log(yellow(`  ~ Existant  ${p.prenom} ${p.nom} <${p.email}>`));
        skipped++;
        continue;
      }

      // Le hook beforeCreate du modèle hache automatiquement le mot de passe
      await User.create({
        prenom:        p.prenom,
        nom:           p.nom,
        email:         p.email,
        password_hash: PASSWORD,   // hashé par le hook bcrypt
        role:          'joueur',
        club_id:       CLUB_ID,
        actif:         true,
      });

      console.log(green(`  ✓ Créé      ${p.prenom} ${p.nom} <${p.email}>`));
      created++;

    } catch (err) {
      console.log(red(`  ✗ Erreur    ${p.prenom} ${p.nom} — ${err.message}`));
      errors++;
    }
  }

  console.log('\n' + bold('══════════════════════════════════════'));
  console.log(`  ${green('✓')} Créés   : ${bold(created)}`);
  console.log(`  ${yellow('~')} Existants: ${bold(skipped)}`);
  if (errors > 0) console.log(`  ${red('✗')} Erreurs : ${bold(errors)}`);
  console.log(bold('══════════════════════════════════════'));
  console.log(`\n  🔑 Mot de passe : ${bold(PASSWORD)}`);
  console.log(`  🏟  Club ID     : ${bold(CLUB_ID)}`);
  console.log(`  📧 Emails       : {prenom}@clubtest.fr\n`);

  await sequelize.close();
}

main().catch(err => {
  console.error(red('\nErreur fatale : ' + err.message));
  process.exit(1);
});

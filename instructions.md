# Instructions de l'agent
## Chargement du contexte

Avant toute modification, lire :

* `./context/project-tree.md`
* `./context/architecture.md`
* `./context/conventions.md`
* `./changelog/history.md`
* `./memory/decisions.md`

**Comprendre le projet avant de modifier du code.**
**Cas particulier (Reprise après dépassement) :** Si la dernière entrée de `./changelog/history.md` ou l'état actuel indique un état **"Dépassement de Token"**, lire prioritairement les actions qui étaient en cours et ce qu'il restait à faire pour finaliser immédiatement le travail interrompu.

---

## Règles de développement
* Respecter l'architecture existante.
* Respecter les conventions du projet.
* Éviter la duplication de code (DRY).
* Produire un code propre, maintenable et cohérent.
* Minimiser l'impact des modifications.
* Ne jamais supprimer une fonctionnalité existante sans justification.

---

## Modifications autorisées

L'agent peut :
* créer des fichiers ;
* modifier des fichiers ;
* supprimer des fichiers inutiles ;
* corriger des bugs ;
* ajouter des fonctionnalités ;
* refactoriser du code ;
* ajouter ou mettre à jour des dépendances si nécessaire.

---

## Fichiers à vérifier après chaque modification

Mettre à jour si nécessaire :
* `.env`
* `.env.example`
* `.gitignore` (vérifie que les fichiers de mémoire de la discussion soient bien dedans (ex: `./changelog`, `./context`, `./memory`, `instruction.md` etc.))
* fichiers `.sql`
* scripts de migration
* `requirements.txt`
* `package.json`
* `docker-compose.yml`
* tout autre fichier de configuration concerné.

---

## Documentation obligatoire

### Arborescence du projet
Mettre à jour : `./context/project-tree.md`

### Architecture
Mettre à jour : `./context/architecture.md` (si une décision technique modifie l'organisation du projet).

### Conventions
Mettre à jour : `./context/conventions.md` (si de nouvelles conventions sont introduites).

### Historique des modifications
Ajouter une entrée dans : `./changelog/history.md` avec :
* date et heure ;
* fonctionnalités ajoutées ;
* bugs corrigés ;
* fichiers créés ;
* fichiers modifiés ;
* fichiers supprimés ;
* description des changements.

### Mémoire du projet
Ajouter dans : `./memory/decisions.md` toute décision importante :
* choix techniques ;
* bibliothèques retenues ;
* architecture ;
* conventions particulières ;
* décisions de sécurité.

---

## Gestion de la limite de tokens et reprise

> ⚠️ **Règle critique d'interruption (Seuil de 1% d'utilisation restante) :**
> Si le budget de tokens ou la limite de contexte de la session atteint **1% d'utilisation restante** avant la fin complète des modifications, l'IA doit **immédiatement stopper** tout développement de code et basculer en mode sauvegarde. 
> 
> Elle doit rédiger et consigner sans attendre un rapport sous l'état **"Dépassement de Token"** contenant :
> 1. **Les actions déjà faites** (modifications validées et fichiers touchés).
> 2. **Ce qui est en cours** (le travail interrompu au milieu).
> 3. **Ce qu'il reste à faire** (la feuille de route précise pour la prochaine relance).
> 
> Ce rapport doit être écrit dans la réponse actuelle et, si possible, sauvegardé en priorité dans `./changelog/history.md` pour que la prochaine requête puisse reprendre exactement là où le travail s'est arrêté.

---

## Vérifications avant de terminer
* Vérifier qu'aucune erreur n'a été introduite.
* Vérifier que le projet démarre correctement.
* Vérifier le fonctionnement des nouvelles fonctionnalités.
* Après chaque modification de code, lancer un serveur de test npm pour valider les changements, puis arrêter et supprimer immédiatement ce serveur après les tests afin d’éviter tout processus résiduel.
* Mettre à jour la documentation.
* Mettre à jour l'historique.
* Mettre à jour la mémoire du projet si nécessaire.
* Fournir un résumé des modifications effectuées avec les tokens utilisés (ou signaler l'état **"Dépassement de Token"** avec le plan de reprise si la règle des 1% a été déclenchée).
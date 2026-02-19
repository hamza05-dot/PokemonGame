<?php
function getDB() {
    $host = getenv('DB_HOST') ?: 'oracle-db';
    $port = getenv('DB_PORT') ?: '1521';
    $sid  = getenv('DB_SID')  ?: 'XE';
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASSWORD');

    $conn = oci_connect($user, $pass, "$host:$port/$sid", 'AL32UTF8');
    if (!$conn) {
        $e = oci_error();
        throw new Exception($e['message']);
    }
    return $conn;
}

function ociQuery($conn, $sql, $params = []) {
    $stmt = oci_parse($conn, $sql);
    if (!$stmt) {
        $e = oci_error($conn);
        throw new Exception($e['message']);
    }
    foreach ($params as $key => $val) {
        oci_bind_by_name($stmt, $key, $params[$key]);
    }
    if (!oci_execute($stmt)) {
        $e = oci_error($stmt);
        throw new Exception($e['message']);
    }
    return $stmt;
}

$action  = $_POST['action'] ?? '';
$message = '';
$msgType = '';

// ── REGISTER ────────────────────────────────────────────────────────────────
if ($action === 'register') {
    $nom      = trim($_POST['nom']      ?? '');
    $prenom   = trim($_POST['prenom']   ?? '');
    $username = trim($_POST['username'] ?? '');
    $age      = (int)($_POST['age']     ?? 0);
    $email    = trim($_POST['email']    ?? '');
    $country  = trim($_POST['country']  ?? '');
    $mdp      = $_POST['mdp']           ?? '';
    $mdp2     = $_POST['mdp2']          ?? '';

    if (!$nom || !$prenom || !$username || !$age || !$email || !$country || !$mdp) {
        $message = 'Veuillez remplir tous les champs.';
        $msgType = 'error';
    } elseif ($mdp !== $mdp2) {
        $message = 'Les mots de passe ne correspondent pas.';
        $msgType = 'error';
    } elseif ($age < 5 || $age > 120) {
        $message = 'Âge invalide.';
        $msgType = 'error';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = 'Adresse email invalide.';
        $msgType = 'error';
    } else {
        try {
            $conn = getDB();
            $hash = password_hash($mdp, PASSWORD_DEFAULT);

            $sql = "INSERT INTO users (nom, prenom, username, age, email, country, password)
                    VALUES (:nom, :prenom, :username, :age, :email, :country, :password)";

            $stmt = oci_parse($conn, $sql);
            oci_bind_by_name($stmt, ':nom',      $nom);
            oci_bind_by_name($stmt, ':prenom',   $prenom);
            oci_bind_by_name($stmt, ':username', $username);
            oci_bind_by_name($stmt, ':age',      $age);
            oci_bind_by_name($stmt, ':email',    $email);
            oci_bind_by_name($stmt, ':country',  $country);
            oci_bind_by_name($stmt, ':password', $hash);

            if (!oci_execute($stmt)) {
                $e = oci_error($stmt);
                throw new Exception($e['message']);
            }

            $message = "Compte créé avec succès ! Bienvenue, $prenom !";
            $msgType = 'success';
            oci_free_statement($stmt);
            oci_close($conn);
        } catch (Exception $e) {
            if (str_contains($e->getMessage(), 'ORA-00001')) {
                $message = "Ce nom d'utilisateur ou email existe déjà.";
            } else {
                $message = 'Erreur base de données : ' . $e->getMessage();
            }
            $msgType = 'error';
        }
    }
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
if ($action === 'login') {
    $identifier = trim($_POST['identifier'] ?? '');
    $mdp        = $_POST['mdp'] ?? '';

    if (!$identifier || !$mdp) {
        $message = 'Veuillez remplir tous les champs.';
        $msgType = 'error';
    } else {
        try {
            $conn = getDB();

            $sql  = "SELECT * FROM users WHERE email = :id OR username = :id2";
            $stmt = oci_parse($conn, $sql);
            oci_bind_by_name($stmt, ':id',  $identifier);
            oci_bind_by_name($stmt, ':id2', $identifier);
            oci_execute($stmt);

            $user = oci_fetch_assoc($stmt);

            if ($user && password_verify($mdp, $user['PASSWORD'])) {
                $message = "Connexion réussie ! Bienvenue, {$user['PRENOM']} {$user['NOM']} !";
                $msgType = 'success';
            } else {
                $message = 'Identifiant ou mot de passe incorrect.';
                $msgType = 'error';
            }

            oci_free_statement($stmt);
            oci_close($conn);
        } catch (Exception $e) {
            $message = 'Erreur base de données : ' . $e->getMessage();
            $msgType = 'error';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pokémon – Connexion</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --red:    #E3350D;
    --yellow: #FFCB05;
    --blue:   #3B4CCA;
    --dark:   #1a1a2e;
    --card:   #16213e;
    --input:  #0f3460;
    --white:  #f0f0f0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100vh;
    background: var(--dark);
    background-image:
      radial-gradient(ellipse at 20% 50%, rgba(59,76,202,0.25) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(227,53,13,0.2) 0%, transparent 50%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    padding: 20px;
  }

  body::before {
    content: '';
    position: fixed;
    top: -180px; right: -180px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: conic-gradient(var(--red) 0deg 180deg, var(--white) 180deg 360deg);
    opacity: 0.06;
    pointer-events: none;
  }
  body::after {
    content: '';
    position: fixed;
    bottom: -150px; left: -150px;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: conic-gradient(var(--yellow) 0deg 180deg, var(--blue) 180deg 360deg);
    opacity: 0.06;
    pointer-events: none;
  }

  .wrapper {
    width: 900px;
    max-width: 100%;
    background: var(--card);
    border-radius: 24px;
    box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }

  .side {
    background: linear-gradient(145deg, var(--red) 0%, #8B0000 100%);
    padding: 50px 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .side::before {
    content: '';
    position: absolute;
    bottom: -80px; left: 50%;
    transform: translateX(-50%);
    width: 280px; height: 280px;
    border-radius: 50%;
    border: 50px solid rgba(255,255,255,0.08);
  }
  .side-logo {
    font-family: 'Press Start 2P', monospace;
    font-size: 22px;
    color: var(--yellow);
    text-shadow: 3px 3px 0 rgba(0,0,0,0.4);
    line-height: 1.5;
    text-align: center;
    margin-bottom: 24px;
    position: relative;
    z-index: 1;
  }
  .side p {
    color: rgba(255,255,255,0.8);
    font-size: 14px;
    text-align: center;
    line-height: 1.7;
    position: relative;
    z-index: 1;
  }
  .pokeball-icon {
    width: 90px; height: 90px;
    margin-bottom: 28px;
    position: relative;
    z-index: 1;
  }
  .pokeball-icon svg { width: 100%; height: 100%; }

  .main {
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 100vh;
  }

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 28px;
    background: var(--input);
    border-radius: 12px;
    padding: 6px;
  }
  .tab-btn {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.25s;
    background: transparent;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.5px;
  }
  .tab-btn.active {
    background: var(--red);
    color: var(--yellow);
    box-shadow: 0 4px 14px rgba(227,53,13,0.4);
  }

  .panel { display: none; }
  .panel.active { display: block; }

  h2 {
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: var(--yellow);
    margin-bottom: 20px;
    letter-spacing: 1px;
  }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .field { margin-bottom: 14px; }
  .field label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .field input, .field select {
    width: 100%;
    background: var(--input);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 11px 14px;
    color: var(--white);
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 600;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
  }
  .field input::placeholder { color: rgba(255,255,255,0.2); }
  .field input:focus, .field select:focus {
    border-color: var(--yellow);
    box-shadow: 0 0 0 3px rgba(255,203,5,0.12);
  }
  .field select option { background: var(--card); }

  .btn {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--red), #c0290a);
    color: var(--yellow);
    font-family: 'Press Start 2P', monospace;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 1px;
    margin-top: 6px;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 6px 20px rgba(227,53,13,0.35);
  }
  .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(227,53,13,0.5); }
  .btn:active { transform: scale(0.97); }

  .message {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .message.success { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
  .message.error   { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

  @media (max-width: 640px) {
    .wrapper { grid-template-columns: 1fr; }
    .side { display: none; }
    .row { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<div class="wrapper">
  <div class="side">
    <div class="pokeball-icon">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="white" stroke="#333" stroke-width="3"/>
        <path d="M2 50 Q2 2 50 2 Q98 2 98 50Z" fill="#E3350D"/>
        <rect x="2" y="47" width="96" height="6" fill="#333"/>
        <circle cx="50" cy="50" r="12" fill="white" stroke="#333" stroke-width="3"/>
        <circle cx="50" cy="50" r="6" fill="#f0f0f0"/>
      </svg>
    </div>
    <div class="side-logo">POKEMON<br>GAME</div>
    <p>Connectez-vous pour rejoindre l'aventure et devenir le meilleur Dresseur !</p>
  </div>

  <div class="main">
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('login')">Connexion</button>
      <button class="tab-btn" onclick="switchTab('register')">Inscription</button>
    </div>

    <?php if ($message): ?>
    <div class="message <?= $msgType ?>">
      <?= $msgType === 'success' ? '✅' : '❌' ?> <?= htmlspecialchars($message) ?>
    </div>
    <?php endif; ?>

    <!-- LOGIN -->
    <div class="panel active" id="panel-login">
      <h2>Se connecter</h2>
      <form method="POST">
        <input type="hidden" name="action" value="login">
        <div class="field">
          <label>Email ou Nom d'utilisateur</label>
          <input type="text" name="identifier" placeholder="ash@pokemon.com" required>
        </div>
        <div class="field">
          <label>Mot de passe</label>
          <input type="password" name="mdp" placeholder="••••••••" required>
        </div>
        <button type="submit" class="btn">▶ JOUER</button>
      </form>
    </div>

    <!-- REGISTER -->
    <div class="panel" id="panel-register">
      <h2>Créer un compte</h2>
      <form method="POST">
        <input type="hidden" name="action" value="register">
        <div class="row">
          <div class="field">
            <label>Nom</label>
            <input type="text" name="nom" placeholder="Ketchum" required>
          </div>
          <div class="field">
            <label>Prénom</label>
            <input type="text" name="prenom" placeholder="Ash" required>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Nom d'utilisateur</label>
            <input type="text" name="username" placeholder="ash_trainer" required>
          </div>
          <div class="field">
            <label>Âge</label>
            <input type="number" name="age" placeholder="10" min="5" max="120" required>
          </div>
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" name="email" placeholder="ash@pokemon.com" required>
        </div>
        <div class="field">
          <label>Pays</label>
          <select name="country" required>
            <option value="" disabled selected>Choisir un pays…</option>
            <option>France</option><option>Belgique</option><option>Suisse</option>
            <option>Canada</option><option>Maroc</option><option>Algérie</option>
            <option>Tunisie</option><option>Sénégal</option><option>Côte d'Ivoire</option>
            <option>États-Unis</option><option>Autre</option>
          </select>
        </div>
        <div class="row">
          <div class="field">
            <label>Mot de passe</label>
            <input type="password" name="mdp" placeholder="••••••••" required>
          </div>
          <div class="field">
            <label>Confirmer mot de passe</label>
            <input type="password" name="mdp2" placeholder="••••••••" required>
          </div>
        </div>
        <button type="submit" class="btn">▶ S'INSCRIRE</button>
      </form>
    </div>
  </div>
</div>

<script>
  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((b, i) =>
      b.classList.toggle('active', (i === 0) === (tab === 'login'))
    );
    document.getElementById('panel-login').classList.toggle('active', tab === 'login');
    document.getElementById('panel-register').classList.toggle('active', tab === 'register');
  }

  <?php if ($action === 'register'): ?>
  switchTab('register');
  <?php endif; ?>
</script>
</body>
</html>
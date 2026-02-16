# ==============================
# EXPORT / IMPORT POKEDB SCHEMA
# ==============================

# 1️⃣ Créer un DIRECTORY Oracle (adapter le chemin selon OS)

-- Windows :
CREATE OR REPLACE DIRECTORY POKEMON_DIR AS 'C:\path\PokemonGame\Database\PokemonBackup';

-- Linux :
CREATE OR REPLACE DIRECTORY POKEMON_DIR AS '/path/PokemonGame/Database/PokemonBackup';

GRANT READ, WRITE ON DIRECTORY POKEMON_DIR TO POKEDB;
-- Permet à Oracle d’écrire le fichier DMP dans ce dossier


# 2️⃣ Exporter le schéma POKEDB
expdp POKEDB/5687@localhost:1521/XE DIRECTORY=POKEMON_DIR DUMPFILE=SCHEMA_EXPORT.DMP LOGFILE=export.log SCHEMAS=POKEDB
# Crée SCHEMA_EXPORT.DMP dans le dossier défini


# 3️⃣ Copier le dump vers le conteneur Docker

# Windows :
docker cp "C:\path\PokemonGame\Database\PokemonBackup\SCHEMA_EXPORT.DMP" pokemon_oracle_db:/u01/app/oracle/admin/XE/dpdump/

# Linux :
docker cp /path/PokemonGame/Database/PokemonBackup/SCHEMA_EXPORT.DMP pokemon_oracle_db:/u01/app/oracle/admin/XE/dpdump/

# Copie le fichier dans DATA_PUMP_DIR du conteneur


# 4️⃣ Créer l’utilisateur POKEDB (si nécessaire)
docker exec pokemon_oracle_db sh -c ". /u01/app/oracle/product/11.2.0/xe/bin/oracle_env.sh && echo 'CREATE USER POKEDB IDENTIFIED BY 5687;' | sqlplus -s system/oracle"
# Crée le user dans la base Docker


# 5️⃣ Donner les privilèges
docker exec pokemon_oracle_db sh -c ". /u01/app/oracle/product/11.2.0/xe/bin/oracle_env.sh && echo 'GRANT CONNECT, RESOURCE, DBA TO POKEDB;' | sqlplus -s system/oracle"
# Donne les droits nécessaires


# 6️⃣ Importer le dump
impdp POKEDB/5687@localhost:1522/XE DIRECTORY=DATA_PUMP_DIR DUMPFILE=SCHEMA_EXPORT.DMP LOGFILE=import.log SCHEMAS=POKEDB
# Importe le schéma dans Oracle Docker

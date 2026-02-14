-- 1️⃣ Créer un DIRECTORY Oracle pointant vers ton dossier Windows



CREATE OR REPLACE DIRECTORY POKEMON\_DIR AS 'C:\\Users\\lenocvo m\\Documents\\PokemonGame\\Database\\PokemonBackup';

GRANT READ, WRITE ON DIRECTORY POKEMON\_DIR TO POKEDB;

-- Ceci permet à Oracle d’écrire les fichiers DMP dans ce dossier





Copy fichiers DMP from C:\\ORACLEXE\\APP\\ORACLE\\ADMIN\\XE\\DPDUMP to C:\\Users\\lenocvo m\\Documents\\PokemonGame\\Database\\PokemonBackup

-- 2️⃣ Exporter la base POKEDB vers le fichier DMP



expdp POKEDB/5687@localhost:1521/XE DIRECTORY=POKEMON\_DIR DUMPFILE=SCHEMA\_EXPORT.DMP LOGFILE=export.log SCHEMAS=POKEDB

-- Le dump sera créé dans le dossier défini par POKEMON\_DIR



-- 3️⃣ Copier le fichier DMP dans le conteneur Docker Oracle



docker cp "C:\\Users\\lenocvo m\\Documents\\PokemonGame\\Database\\PokemonBackup\\SCHEMA\_EXPORT.DMP" pokemon\_oracle\_db:/u01/app/oracle/admin/XE/dpdump/

-- Copie le dump depuis Windows vers le dossier dpdump du conteneur



-- 4️⃣ Importer le dump dans la base du conteneur Docker



impdp POKEDB/5687@localhost:1522/XE DIRECTORY=DATA\_PUMP\_DIR DUMPFILE=SCHEMA\_EXPORT.DMP LOGFILE=import.log SCHEMAS=POKEDB

-- Importe le dump dans la base Oracle du conteneur




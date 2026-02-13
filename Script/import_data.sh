#!/bin/bash
docker cp ../Database/PokemonBackup/pokemon_export.dmp pokemon_oracle_db:/tmp/pokemon_backup.dmp
docker exec -it pokemon_oracle_db bash -c "
sqlplus system/5687@XE <<EOF
CREATE USER POKEDB IDENTIFIED BY 5687;
GRANT ALL PRIVILEGES TO POKEDB;
EXIT;
EOF
impdp POKEDB/5687@XE directory=TMPDIR dumpfile=pokemon_backup.dmp logfile=import.log
"
echo "Import finished"

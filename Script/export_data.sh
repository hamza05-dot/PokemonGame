#!/bin/bash
docker exec -it pokemon_oracle_db bash -c "
expdp POKEDB/5687@XE directory=DATA_PUMP_DIR dumpfile=pokemon_export.dmp logfile=export.log
"
docker cp pokemon_oracle_db:/u01/app/oracle/admin/XE/dpdump/pokemon_export.dmp ../Database/PokemonBackup/
echo "Export finished. File is in ../Database/PokemonBackup/pokemon_export.dmp"

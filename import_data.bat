@echo off
echo ========================================
echo  Importing Pokemon Database to Docker
echo ========================================
echo.

echo [1/4] Copying backup file to container...
docker cp Database/PokemonBackup/pokemon_backup.dmp pokemon_oracle_db:/tmp/pokemon_backup.dmp

echo [2/4] Creating POKEDB user (step 1)...
docker exec pokemon_oracle_db sh -c ". /u01/app/oracle/product/11.2.0/xe/bin/oracle_env.sh && echo 'CREATE USER POKEDB IDENTIFIED BY 5687;' | sqlplus -s system/oracle"

echo [3/4] Granting privileges to POKEDB...
docker exec pokemon_oracle_db sh -c ". /u01/app/oracle/product/11.2.0/xe/bin/oracle_env.sh && echo 'GRANT CONNECT, RESOURCE, DBA TO POKEDB;' | sqlplus -s system/oracle"

echo [4/4] Importing data (this may take 1-2 minutes)...
docker exec pokemon_oracle_db sh -c ". /u01/app/oracle/product/11.2.0/xe/bin/oracle_env.sh && imp system/oracle fromuser=POKEDB touser=POKEDB file=/tmp/pokemon_backup.dmp ignore=y"

echo.
echo ========================================
echo  Verifying Import...
echo ========================================
docker exec pokemon_oracle_db sh -c ". /u01/app/oracle/product/11.2.0/xe/bin/oracle_env.sh && echo 'SELECT COUNT(*) AS TOTAL_POKEMON FROM POKEDB.POKEMON;' | sqlplus -s POKEDB/5687"

echo.
echo ========================================
echo  Import Complete!
echo ========================================
echo Your Pokemon database is now ready!
echo.
echo Test at: http://localhost
echo.
pause
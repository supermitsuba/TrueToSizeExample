-- create user stockx
CREATE USER stockx;
ALTER USER stockx with encrypted password 'stockx';

-- create database stockx
CREATE DATABASE stockx OWNER stockx;
GRANT ALL PRIVILEGES ON DATABASE stockx TO stockx;
GRANT ALL PRIVILEGES ON DATABASE stockx TO root;

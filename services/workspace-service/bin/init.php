<?php
require __DIR__.'/../vendor/autoload.php';
$db=new PDO(getenv('DATABASE_DSN'),getenv('DB_USER'),getenv('DB_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec(file_get_contents(__DIR__.'/../schema.sql'));

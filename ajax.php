<?php

error_reporting(~E_ALL);
ini_set('display_errors', 'off');

$db_filename = 'ajax.json';
$db = json_decode(file_get_contents($db_filename), true);

if (!$db) {
    $db = [];
}

switch ($_REQUEST['action']) {
    case 'get':
        response($db); // отдаем информацию о забронированных днях
        break;

    case 'book':
        if ($days = json_decode($_POST['days'], true)) {
            foreach ($days as $idx => $val) {
                if (!is_numeric($idx) || $idx < 1 || $idx > 31) return response(['err' => 2]); // переданы некорректные данные
                if ($db[$idx]) return response(['err' => 1]); // день уже забронирован

                $db[$idx] = true; // бронируем
            }

            file_put_contents($db_filename, json_encode($db)); // сохраняем изменения
            response(['success' => true]);
        } else {
            response(['err' => 3]); // передаваемые данные должны быть в виде массива
        }

        break;

    default:
        response(['err' => 4]); // не передано никаких данных
}

function response($arr) {
    echo json_encode($arr);
}
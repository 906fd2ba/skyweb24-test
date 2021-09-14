var selectable = false;
var selected = {};

// при загрузке страницы
$(function () {
    // получаем с сервера информацию об уже забронированных днях
    $.ajax({
        type: 'POST',
        url: 'ajax.php',
        data: 'action=get',
        success: function (response) {
            let days = JSON.parse(response); // переводим ответ из json в массив
            let cols = $('.bookable'); // получаем все колонки, доступные для бронирования
            let btn = $('#js-modal-confirm'); // кнопка бронирования

            // проходимся по всем дням
            for (let i = 1; i <= 31; i++) {
                let col = $(cols[i - 1]); // элемент колонки текущего дня
                let is_booked = days[i]; // информация обо дне, полученная от сервера (забронирован = true)

                // если такого дня нет в таблице, то пропускаем его и идем дальше (29-31)
                if (!col) continue;

                if (is_booked) {
                    // день уже забронирован
                    col.addClass('booked');
                    col.prop('title', 'Забронировано');
                } else {
                    // день свободен для бронирования
                    col.addClass('not-booked');
                    col.prop('title', 'Свободно');

                    // добавляем событие при нажатии на день
                    col.on('click', function () {
                        // не обрабатываем нажатие если кнопка уже была нажата или если событие загрузки страницы еще не завершило работу
                        if (!selectable) return false;

                        if (!selected[i]) {
                            // если день не был выбран, то выделяем его
                            selected[i] = true;
                            col.addClass('selected');
                        } else {
                            // если день был выбран, убираем выделение
                            delete selected[i];
                            col.removeClass('selected');
                        }

                        // если выбран хоть один день, то отображаем кнопку
                        btn.toggleClass('hidden', Object.keys(selected).length == 0);
                    });
                }
            }

            // при нажатии на кнопку
            UIkit.util.on('#js-modal-confirm', 'click', function (e) {
                e.preventDefault();
                e.target.blur();

                if (Object.keys(selected).length == 0) {
                    return UIkit.modal.alert('Выберите хотя бы один свободный день.');
                }

                let days = '';

                for (let i = 1; i <= 31; i++) {
                    let col = $(cols[i - 1]); // элемент колонки текущего дня

                    if (col.hasClass('selected')) {
                        days += i + ' сентября 2021<br />\n'; // т.к. не генерируем календарь
                    }
                }

                UIkit.modal.confirm('Подтвердите правильность ввода данных:<br />\n' + days).then(function () {
                    // после нажатия на кнопку запрещаем редактировать календарь
                    selectable = false;

                    // скрываем кнопку и отображаем текст
                    btn.addClass('hidden');
                    $($('.booking-in-progress')[0]).removeClass('hidden');

                    // отправляем на сервер информацию о выбранных днях
                    $.ajax({
                        type: 'POST',
                        url: 'ajax.php',
                        data: $.param({
                            action: 'book',
                            days: JSON.stringify(selected)
                        }),
                        success: function (response) {
                            let resp = JSON.parse(response);

                            $($('.booking-in-progress')[0]).addClass('hidden');

                            if (resp.success) {
                                $($('.booking-successful')[0]).removeClass('hidden');
                            } else {
                                $($('.booking-error')[0]).removeClass('hidden');

                                switch (resp.err) {
                                    case 1:
                                        // тут показать modal с ошибкой что какой-то из дней уже зарезервирован
                                        UIkit.modal.alert('Какой-то из выбранных вами дней уже был забронирован.');
                                        break;

                                    case 2:
                                    case 3:
                                    case 4:
                                        // тут показать modal с ошибкой что отправлены некорректные данные
                                        UIkit.modal.alert('Переданы некорректные данные.');
                                        break;

                                    default:
                                        // показать modal неизвестная ошибка
                                        UIkit.modal.alert('Произошла неизвестная ошибка.');
                                }
                            }
                        }
                    });
                });
            });

            // разрешаем выбирать дни в календаре
            selectable = true;
        }
    });
});
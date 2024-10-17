function toggleNotifications() {
    var dropdown = document.getElementById("notificationDropdown");
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
    } else {
        dropdown.style.display = "none";
    }
}

// Đóng dropdown khi nhấp bên ngoài
window.onclick = function (event) {
    if (!event.target.matches('.notification-icon')) {
        var dropdowns = document.getElementsByClassName("notification-dropdown");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.style.display === "block") {
                openDropdown.style.display = "none";
            }
        }
    }
}

function goToProfile() {
    window.location.href = "myProfile.html";
}


document.addEventListener('DOMContentLoaded', function () {
    // Hàm để cập nhật thông báo từ API
    function fetchNotifications() {
        fetch('http://localhost:5000/api/notifications')
            .then(response => response.json())
            .then(data => {
                const notificationDropdown = document.getElementById('notificationDropdown');
                notificationDropdown.innerHTML = ''; // Xóa nội dung cũ

                data.forEach(notification => {
                    const p = document.createElement('p');
                    p.textContent = `${notification.timestamp}: ${notification.message}`;
                    notificationDropdown.appendChild(p);
                });
            })
            .catch(error => console.error('Error fetching notifications:', error));
    }

    // Lấy dữ liệu thông báo khi tải trang
    fetchNotifications();

    // Lấy dữ liệu thông báo theo định kỳ
    setInterval(fetchNotifications, 10000); // Cập nhật mỗi 10 giây

    // Các đoạn mã khác không thay đổi
    function toggleNotifications() {
        var dropdown = document.getElementById("notificationDropdown");
        if (dropdown.style.display === "none" || dropdown.style.display === "") {
            dropdown.style.display = "block";
        } else {
            dropdown.style.display = "none";
        }
    }

    window.onclick = function (event) {
        if (!event.target.matches('.notification-icon')) {
            var dropdowns = document.getElementsByClassName("notification-dropdown");
            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.style.display === "block") {
                    openDropdown.style.display = "none";
                }
            }
        }
    }


    // document.querySelectorAll('.switch input[type="checkbox"]').forEach(switchElement => {
    //     switchElement.addEventListener('change', function (event) {
    //         event.preventDefault();
    //         event.stopPropagation();

    //         const deviceElement = this.closest('.device');
    //         const deviceName = deviceElement.querySelector('.device-icon').alt.toLowerCase();
    //         const status = this.checked ? 'on' : 'off';

    //         fetch('http://localhost:5000/api/update-status', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 device_name: deviceName,
    //                 status: status
    //             })
    //         })
    //             .then(response => response.json())
    //             .then(data => {
    //                 console.log(data.message);
    //             })
    //             .catch(error => console.error('Lỗi khi cập nhật trạng thái thiết bị:', error));
    //     });
    // });
});




document.addEventListener('DOMContentLoaded', function () {
    // Hàm để cập nhật thông báo từ API
    function fetchNotifications() {
        fetch('http://localhost:5000/api/notifications')
            .then(response => response.json())
            .then(data => {
                const notificationDropdown = document.getElementById('notificationDropdown');
                notificationDropdown.innerHTML = ''; // Xóa nội dung cũ

                data.forEach(notification => {
                    const p = document.createElement('p');
                    p.textContent = `${notification.timestamp}: ${notification.message}`;
                    p.classList.add('notification-item');
                    p.dataset.timestamp = notification.timestamp;
                    p.dataset.message = notification.message;
                    notificationDropdown.appendChild(p);
                });
            })
            .catch(error => console.error('Error fetching notifications:', error));
    }

    // Lấy dữ liệu thông báo khi tải trang
    fetchNotifications();

    // Lấy dữ liệu thông báo theo định kỳ
    setInterval(fetchNotifications, 10000); // Cập nhật mỗi 10 giây

    // Xử lý sự kiện bấm vào thông báo
    document.getElementById('notificationDropdown').addEventListener('click', function (event) {
        if (event.target.classList.contains('notification-item')) {
            const message = event.target.dataset.message;
            const timestamp = event.target.dataset.timestamp;
            showNotificationDetail(message, timestamp);
        }
    });

    // Hàm để hiển thị chi tiết thông báo
    function showNotificationDetail(message, timestamp) {
        const detailWindow = document.getElementById('notificationDetail');
        detailWindow.querySelector('.detail-message').textContent = message;
        detailWindow.querySelector('.detail-timestamp').textContent = `Thông báo hệ thống đã gửi vào lúc: ${timestamp}`;
        detailWindow.style.display = 'block'; // Hiển thị cửa sổ chi tiết
    }

    // Xử lý sự kiện đóng cửa sổ chi tiết
    document.getElementById('closeDetail').addEventListener('click', function () {
        document.getElementById('notificationDetail').style.display = 'none';
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Hàm để hiển thị chi tiết thông báo
    function showNotificationDetail(message, timestamp) {
        const detailWindow = document.getElementById('notificationDetail');
        detailWindow.querySelector('.detail-timestamp').textContent = `Thông báo hệ thống đã gửi vào lúc: ${timestamp}`;
        detailWindow.querySelector('.detail-message').textContent = message;
        detailWindow.style.display = 'block'; // Hiển thị cửa sổ chi tiết
    }

    // Xử lý sự kiện đóng cửa sổ chi tiết
    document.getElementById('closeDetail').addEventListener('click', function () {
        document.getElementById('notificationDetail').style.display = 'none';
    });
});

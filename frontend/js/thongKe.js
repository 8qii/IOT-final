document.addEventListener('DOMContentLoaded', function () {
    let rowsPerPage = 10; // Số dòng mỗi trang
    let currentPage = 1; // Trang hiện tại
    let totalRecords = 0; // Tổng số bản ghi
    let data = []; // Dữ liệu từ API
    let filteredData = []; // Dữ liệu đã lọc
    let sortDirection = {}; // Hướng sắp xếp

    async function fetchData() {
        const filter = document.getElementById('filterSelect').value;
        const searchQuery = document.getElementById('searchInput').value;

        try {
            // Gửi yêu cầu API với các tham số phân trang
            const response = await fetch(`http://localhost:5000/api/sensors-filter?filter=${filter}&search=${encodeURIComponent(searchQuery)}&page=${currentPage}&rowsPerPage=${rowsPerPage}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            data = result.data; // Dữ liệu nhận được từ API
            totalRecords = result.total; // Tổng số bản ghi từ API
            filteredData = data; // Dữ liệu đã lọc
            displayData(); // Hiển thị dữ liệu
            setupPagination(); // Thiết lập phân trang
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function displayData() {
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = ''; // Xóa nội dung bảng

        // Hiển thị dữ liệu
        filteredData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${item.id !== null ? item.id : '--'}</td>
            <td>${item.temperature !== null ? item.temperature : '--'}</td>
            <td>${item.humidity !== null ? item.humidity : '--'}</td>
            <td>${item.light !== null ? item.light : '--'}</td>
            <td>${item.dust !== null ? item.dust : '--'}</td>
            <td>${item.time !== null ? item.time : '--'}</td>
            `;
            tableBody.appendChild(row); // Thêm hàng vào bảng
        });
    }

    function setupPagination() {
        const totalPages = Math.ceil(totalRecords / rowsPerPage); // Tính tổng số trang
        const paginationContainer = document.querySelector('#pagination');
        paginationContainer.innerHTML = ''; // Xóa nội dung phân trang

        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.disabled = currentPage === 1; // Vô hiệu hóa nút trước nếu ở trang đầu
        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--; // Giảm trang hiện tại
                fetchData(); // Lấy dữ liệu mới
            }
        });
        paginationContainer.appendChild(prevButton); // Thêm nút trước

        const range = 2; // Số trang hiển thị xung quanh trang hiện tại
        let start = Math.max(currentPage - range, 1);
        let end = Math.min(currentPage + range, totalPages);

        if (start > 1) {
            paginationContainer.appendChild(createPageButton(1)); // Thêm nút trang đầu
            if (start > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'ellipsis';
                paginationContainer.appendChild(ellipsis); // Thêm dấu ba chấm nếu cần
            }
        }

        for (let i = start; i <= end; i++) {
            paginationContainer.appendChild(createPageButton(i)); // Thêm nút trang số
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'ellipsis';
                paginationContainer.appendChild(ellipsis); // Thêm dấu ba chấm nếu cần
            }
            paginationContainer.appendChild(createPageButton(totalPages)); // Thêm nút trang cuối
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.disabled = currentPage === totalPages; // Vô hiệu hóa nút sau nếu ở trang cuối
        nextButton.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++; // Tăng trang hiện tại
                fetchData(); // Lấy dữ liệu mới
            }
        });
        paginationContainer.appendChild(nextButton); // Thêm nút sau
    }

    function createPageButton(pageNumber) {
        const button = document.createElement('button');
        button.textContent = pageNumber;
        button.addEventListener('click', function () {
            currentPage = pageNumber; // Cập nhật trang hiện tại
            fetchData(); // Lấy dữ liệu mới
        });

        if (pageNumber === currentPage) {
            button.classList.add('active'); // Đánh dấu nút trang hiện tại
        }

        return button;
    }

    function filterData() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase(); // Chuyển giá trị tìm kiếm thành chữ thường
        const filterOption = document.getElementById('sensorFilterSelect').value; // Lấy giá trị của dropdown

        filteredData = data.filter(item => {
            let matchesSearch = false;

            // Kiểm tra dựa trên giá trị của dropdown
            if (filterOption === 'all') {
                matchesSearch = item.time.toLowerCase().includes(searchTerm);
            } else if (filterOption === 'temperature') {
                matchesSearch = item.temperature.toString().includes(searchTerm);
            } else if (filterOption === 'humidity') {
                matchesSearch = item.humidity.toString().includes(searchTerm);
            } else if (filterOption === 'light') {
                matchesSearch = item.light.toString().includes(searchTerm);
            } else if (filterOption === 'dust') {
                matchesSearch = item.dust.toString().includes(searchTerm);
            }

            return matchesSearch;
        });

        currentPage = 1; // Đặt lại trang hiện tại về 1
        displayData(); // Hiển thị dữ liệu đã lọc
        setupPagination(); // Thiết lập phân trang
    }

    function sortData(column) {
        const direction = sortDirection[column] === 'asc' ? 'desc' : 'asc';
        sortDirection[column] = direction;

        filteredData.sort((a, b) => {
            if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        document.querySelectorAll('th.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
        });

        const header = document.querySelector(`th[data-sort="${column}"]`);
        header.classList.add(direction);

        displayData(); // Hiển thị dữ liệu đã sắp xếp
    }

    document.getElementById('searchInput').addEventListener('input', filterData); // Thêm sự kiện tìm kiếm

    const headers = document.querySelectorAll('#dataTable thead th');
    headers.forEach(header => {
        header.addEventListener('click', function () {
            const column = header.getAttribute('data-sort');
            sortData(column); // Sắp xếp dữ liệu theo cột được nhấp
        });
    });

    document.getElementById('entriesSelect').addEventListener('change', function () {
        rowsPerPage = parseInt(this.value); // Cập nhật số dòng trên mỗi trang
        currentPage = 1; // Đặt lại trang hiện tại về 1
        fetchData(); // Lấy dữ liệu mới
    });

    document.getElementById('filterSelect').addEventListener('change', function () {
        currentPage = 1; // Đặt lại trang hiện tại về 1
        fetchData(); // Lấy dữ liệu mới
    });

    fetchData(); // Gọi hàm để lấy dữ liệu ban đầu
});

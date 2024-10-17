document.addEventListener('DOMContentLoaded', function () {
    let rowsPerPage = 10; // Mặc định là 10 hàng mỗi trang
    let currentPage = 1;
    let data = [];
    let filteredData = [];
    let sortDirection = {};

    async function fetchData(filter = 'all') {
        try {
            const response = await fetch(`http://localhost:5000/api/devices-filter?filter=${filter}`);
            data = await response.json();
            filteredData = data;
            displayData();
            setupPagination();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function mapDeviceName(deviceName) {
        switch (deviceName) {
            case 'light':
                return 'Đèn';
            case 'ac':
                return 'Điều hòa';
            case 'fan':
                return 'Quạt';
            default:
                return deviceName;
        }
    }

    function displayData() {
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = '';

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = filteredData.slice(start, end);

        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${mapDeviceName(item.device_name)}</td>
                <td>${item.status.toUpperCase()}</td>
                <td>${item.time}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function setupPagination() {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const paginationContainer = document.querySelector('#pagination');
        paginationContainer.innerHTML = '';

        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                displayData();
                setupPagination();
            }
        });
        paginationContainer.appendChild(prevButton);

        const range = 2; // Số trang trước và sau trang hiện tại sẽ được hiển thị
        let start = Math.max(currentPage - range, 1);
        let end = Math.min(currentPage + range, totalPages);

        if (start > 1) {
            paginationContainer.appendChild(createPageButton(1));
            if (start > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'ellipsis'; // Thêm class cho dấu ...
                paginationContainer.appendChild(ellipsis);
            }
        }

        for (let i = start; i <= end; i++) {
            paginationContainer.appendChild(createPageButton(i));
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'ellipsis'; // Thêm class cho dấu ...
                paginationContainer.appendChild(ellipsis);
            }
            paginationContainer.appendChild(createPageButton(totalPages));
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                displayData();
                setupPagination();
            }
        });
        paginationContainer.appendChild(nextButton);
    }

    function createPageButton(pageNumber) {
        const button = document.createElement('button');
        button.textContent = pageNumber;
        button.addEventListener('click', function () {
            currentPage = pageNumber;
            displayData();
            setupPagination();
        });

        if (pageNumber === currentPage) {
            button.classList.add('active');
        }

        return button;
    }

    function filterData() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filteredData = data.filter(item => {
            const deviceMatch = mapDeviceName(item.device_name).toLowerCase().includes(searchTerm);
            const timeMatch = item.time.toLowerCase().includes(searchTerm);
            return deviceMatch || timeMatch;
        });
        currentPage = 1;
        displayData();
        setupPagination();
    }

    function sortData(column) {
        const direction = sortDirection[column] === 'asc' ? 'desc' : 'asc';
        sortDirection[column] = direction;

        filteredData.sort((a, b) => {
            if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Xóa lớp sắp xếp khỏi tất cả các cột
        document.querySelectorAll('th.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
        });

        // Thêm lớp sắp xếp vào cột hiện tại
        const header = document.querySelector(`th[data-sort="${column}"]`);
        header.classList.add(direction);

        displayData();
    }

    document.getElementById('searchInput').addEventListener('input', filterData);

    const headers = document.querySelectorAll('#dataTable thead th');
    headers.forEach(header => {
        header.addEventListener('click', function () {
            const column = header.getAttribute('data-sort');
            sortData(column);
        });
    });

    document.getElementById('entriesPerPage').addEventListener('change', function (e) {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1; // Reset lại trang
        displayData();
        setupPagination();
    });

    document.getElementById('filterSelect').addEventListener('change', (event) => {
        const filterValue = event.target.value;
        fetchData(filterValue);
    });

    // Lấy dữ liệu mặc định khi trang được tải
    fetchData();
});

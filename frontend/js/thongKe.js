document.addEventListener('DOMContentLoaded', function () {
    let rowsPerPage = 10;
    let currentPage = 1;
    let data = [];
    let filteredData = [];
    let sortDirection = {};

    async function fetchData() {
        const filter = document.getElementById('filterSelect').value;
        const searchQuery = document.getElementById('searchInput').value;

        try {
            const response = await fetch(`http://localhost:5000/api/sensors-filter?filter=${filter}&search=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            data = await response.json();
            filteredData = data;
            displayData();
            setupPagination();
        } catch (error) {
            console.error('Error fetching data:', error);
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
            <td>${item.id !== null ? item.id : '--'}</td>
            <td>${item.temperature !== null ? item.temperature : '--'}</td>
            <td>${item.humidity !== null ? item.humidity : '--'}</td>
            <td>${item.light !== null ? item.light : '--'}</td>
            <td>${item.dust !== null ? item.dust : '--'}</td>
            <td>${item.time !== null ? item.time : '--'}</td>
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

        const range = 2;
        let start = Math.max(currentPage - range, 1);
        let end = Math.min(currentPage + range, totalPages);

        if (start > 1) {
            paginationContainer.appendChild(createPageButton(1));
            if (start > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'ellipsis';
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
                ellipsis.className = 'ellipsis';
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
        const searchTerm = document.getElementById('searchInput').value.toLowerCase(); // Chuyển giá trị tìm kiếm thành chữ thường để so sánh không phân biệt hoa-thường
        const filterOption = document.getElementById('sensorFilterSelect').value; // Lấy giá trị của dropdown
    
        filteredData = data.filter(item => {
            let matchesSearch = false;
    
            // Kiểm tra dựa trên giá trị của dropdown
            if (filterOption === 'all') {
                // Nếu chọn "Tất cả", chỉ tìm kiếm theo cột "Time"
                matchesSearch = item.time.toLowerCase().includes(searchTerm);
            } else if (filterOption === 'temperature') {
                // Tìm kiếm theo cột "Temperature"
                matchesSearch = item.temperature.toString().includes(searchTerm);
            } else if (filterOption === 'humidity') {
                // Tìm kiếm theo cột "Humidity"
                matchesSearch = item.humidity.toString().includes(searchTerm);
            } else if (filterOption === 'light') {
                // Tìm kiếm theo cột "Light"
                matchesSearch = item.light.toString().includes(searchTerm);
            } else if (filterOption === 'dust') {
                // Tìm kiếm theo cột "Dust"
                matchesSearch = item.dust.toString().includes(searchTerm);
            }

    
            return matchesSearch;
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

        document.querySelectorAll('th.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
        });

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

    document.getElementById('entriesSelect').addEventListener('change', function () {
        rowsPerPage = parseInt(this.value);
        currentPage = 1;
        displayData();
        setupPagination();
    });

    document.getElementById('filterSelect').addEventListener('change', function () {
        fetchData();
    });

    fetchData();
});

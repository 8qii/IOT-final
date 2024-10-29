document.addEventListener('DOMContentLoaded', function () {
    let rowsPerPage = 10; 
    let currentPage = 1; 
    let totalRecords = 0; 
    let sortColumn = 'id'; // Cột mặc định
    let sortDirection = 'asc'; // Hướng mặc định

    async function fetchData() {
        const filter = document.getElementById('filterSelect').value;
        const sensorFilter = document.getElementById('sensorFilterSelect').value;
        const searchQuery = document.getElementById('searchInput').value;

        try {
            // Gửi yêu cầu API với các tham số lọc, phân trang và sắp xếp
            const response = await fetch(
                `http://localhost:5000/api/sensors-filter?filter=${filter}&sensorFilter=${sensorFilter}&search=${encodeURIComponent(searchQuery)}&page=${currentPage}&rowsPerPage=${rowsPerPage}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`
            );

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const result = await response.json();
            displayData(result.data); // Hiển thị dữ liệu
            totalRecords = result.total; // Cập nhật tổng số bản ghi
            setupPagination(); // Thiết lập phân trang
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function displayData(data) {
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = ''; 

        data.forEach(item => {
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
        const totalPages = Math.ceil(totalRecords / rowsPerPage);
        const paginationContainer = document.querySelector('#pagination');
        paginationContainer.innerHTML = ''; 

        const prevButton = document.createElement('button');
        prevButton.textContent = '<';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                fetchData();
            }
        });
        paginationContainer.appendChild(prevButton);

        const range = 2;
        let start = Math.max(currentPage - range, 1);
        let end = Math.min(currentPage + range, totalPages);

        if (start > 1) {
            paginationContainer.appendChild(createPageButton(1));
            if (start > 2) {
                paginationContainer.appendChild(createEllipsis());
            }
        }

        for (let i = start; i <= end; i++) {
            paginationContainer.appendChild(createPageButton(i));
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                paginationContainer.appendChild(createEllipsis());
            }
            paginationContainer.appendChild(createPageButton(totalPages));
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = '>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                fetchData();
            }
        });
        paginationContainer.appendChild(nextButton);
    }

    function createPageButton(pageNumber) {
        const button = document.createElement('button');
        button.textContent = pageNumber;
        button.addEventListener('click', function () {
            currentPage = pageNumber;
            fetchData();
        });

        if (pageNumber === currentPage) {
            button.classList.add('active');
        }

        return button;
    }

    function createEllipsis() {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.className = 'ellipsis';
        return ellipsis;
    }

    const headers = document.querySelectorAll('#dataTable thead th.sortable');
    headers.forEach(header => {
        header.addEventListener('click', function () {
            const column = header.getAttribute('data-sort');
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            fetchData();
        });
    });

    document.getElementById('searchInput').addEventListener('input', function () {
        currentPage = 1;
        fetchData();
    });

    document.getElementById('filterSelect').addEventListener('change', function () {
        currentPage = 1;
        fetchData();
    });

    document.getElementById('entriesSelect').addEventListener('change', function () {
        rowsPerPage = parseInt(this.value);
        currentPage = 1;
        fetchData();
    });

    fetchData(); 
});

// Mảng cấu trúc dữ liệu lưu danh sách các cuốn sách
let books = [];

// --- 1. BIẾN TOÀN CỤC & DOM ELEMENTS ---
// Khu vực thống kê
const elTotalBooks = document.getElementById('total-books');
const elAvailableBooks = document.getElementById('available-books');
const elBorrowedBooks = document.getElementById('borrowed-books');

// Công cụ (Toolbar)
const inputSearch = document.getElementById('search-input');
const selectFilter = document.getElementById('category-filter');
const btnAddBook = document.getElementById('btn-add-book');

// Vùng hiển thị sách
const bookGrid = document.getElementById('book-grid');
const emptyState = document.getElementById('empty-state');

// Modal Thêm/Sửa
const modalForm = document.getElementById('book-modal');
const formSubmit = document.getElementById('book-form');
const btnCloseModal = document.querySelector('.close-modal');
const btnCancel = document.getElementById('btn-cancel');

// Modal Chi tiết sách
const modalDetail = document.getElementById('detail-modal');
const btnCloseDetailIcon = document.querySelector('.close-detail');
const btnCloseDetailBtn = document.getElementById('btn-close-detail');

// Form inputs
const inputId = document.getElementById('book-id');
const inputTitle = document.getElementById('book-title');
const inputAuthor = document.getElementById('book-author');
const inputCategory = document.getElementById('book-category');
const inputStatus = document.getElementById('book-status');
const modalTitle = document.getElementById('modal-title');

// --- 2. QUẢN LÝ LOCAL STORAGE ---
// Lấy dữ liệu từ LocalStorage
function loadBooks() {
    const stored = localStorage.getItem('smart-library-books');
    if (stored) {
        books = JSON.parse(stored);
    } else {
        // Cấp một vài dữ liệu mẫu nếu chưa có
        books = [
            { id: Date.now().toString(), title: "Cấu trúc dữ liệu và giải thuật", author: "Nguyễn Văn A", category: "Giáo trình", status: "available", isFav: false },
            { id: (Date.now() + 1).toString(), title: "Nhập môn Lập trình Web", author: "Trần B", category: "Công nghệ IT", status: "borrowed", isFav: true }
        ];
        saveToLocalStorage();
    }
}

// Lưu dữ liệu xuống LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('smart-library-books', JSON.stringify(books));
}


// --- 3. RENDER (HIỂN THỊ) DỮ LIỆU ---
// Cập nhật các con số thống kê
function updateStats(filteredList) {
    const total = filteredList.length;
    const available = filteredList.filter(b => b.status === "available").length;
    const borrowed = filteredList.filter(b => b.status === "borrowed").length;

    elTotalBooks.textContent = total;
    elAvailableBooks.textContent = available;
    elBorrowedBooks.textContent = borrowed;
}

// Hàm vẽ danh sách sách ra giao diện
function renderBooks() {
    // 1. Lấy giá trị bộ lọc và tìm kiếm hiện tại
    const keyword = inputSearch.value.trim().toLowerCase();
    const categoryQuery = selectFilter.value;

    // 2. Lọc mảng books dựa vào 2 điều kiện
    const filteredBooks = books.filter(book => {
        const matchTitle = book.title.toLowerCase().includes(keyword) || book.author.toLowerCase().includes(keyword);
        const matchCategory = categoryQuery === 'all' || book.category === categoryQuery;
        return matchTitle && matchCategory;
    });

    // 3. Cập nhật thống kê tạm thời cho mảng đã lọc
    updateStats(filteredBooks);

    // 4. Reset lưới lưới HTML
    bookGrid.innerHTML = '';

    // Nếu không có dữ liệu phù hợp
    if (filteredBooks.length === 0) {
        bookGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    // Nếu có dữ liệu
    bookGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    // 5. Tạo Card cho từng sách
    filteredBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        // Trạng thái Text & Class
        const statusText = book.status === 'available' ? 'Sẵn sàng' : 'Đã mượn';
        const statusClass = book.status === 'available' ? 'available' : 'borrowed';
        
        // Icon tim màu đỏ nếu isFav = true
        const heartClass = book.isFav ? 'fa-solid fa-heart active' : 'fa-regular fa-heart';

        card.innerHTML = `
            <div class="book-card-header">
                <h3 class="book-title" onclick="openDetailModal('${book.id}')">${book.title}</h3>
                <button class="btn-fav ${book.isFav ? 'active' : ''}" onclick="toggleFavorite('${book.id}')" title="Đánh dấu yêu thích">
                    <i class="${heartClass}"></i>
                </button>
            </div>
            
            <p class="book-author"><i class="fa-solid fa-pen-nib"></i> ${book.author}</p>
            
            <div class="book-tags">
                <span class="tag tag-category">${book.category}</span>
                <span class="tag tag-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="book-actions">
                <button class="btn-action btn-edit" onclick="openEditModal('${book.id}')">
                    <i class="fa-solid fa-pen"></i> Sửa
                </button>
                <button class="btn-action btn-delete" onclick="deleteBook('${book.id}')">
                    <i class="fa-solid fa-trash"></i> Xóa
                </button>
            </div>
        `;
        bookGrid.appendChild(card);
    });
}


// --- 4. CÁC HÀM XỬ LÝ (CRUD) ---

// Mở form Thêm Mới
btnAddBook.addEventListener('click', () => {
    // Reset form
    formSubmit.reset();
    inputId.value = '';
    modalTitle.textContent = "Thêm Sách Mới";
    openModal(modalForm);
});

// Thêm hoặc Cập nhật sách khi submit Form
formSubmit.addEventListener('submit', function(e) {
    e.preventDefault(); // Ngăn load lại trang

    // Lấy dữ liệu từ input
    const newTitle = inputTitle.value.trim();
    const newAuthor = inputAuthor.value.trim();
    const newCat = inputCategory.value;
    const newStatus = inputStatus.value;
    const currentId = inputId.value;

    if (!newTitle || !newAuthor) {
        alert("Vui lòng điền đủ tên sách và tác giả!");
        return;
    }

    if (currentId) {
        // Chế độ Sửa (Edit)
        const index = books.findIndex(b => b.id === currentId);
        if (index > -1) {
            books[index].title = newTitle;
            books[index].author = newAuthor;
            books[index].category = newCat;
            books[index].status = newStatus;
        }
    } else {
        // Chế độ Thêm mới
        const newBook = {
            id: Date.now().toString(), // Tạo ID duy nhất dựa theo mốc thời gian
            title: newTitle,
            author: newAuthor,
            category: newCat,
            status: newStatus,
            isFav: false
        };
        // Thêm vào đầu mảng
        books.unshift(newBook);
    }

    saveToLocalStorage();
    renderBooks();
    closeModal(modalForm);
});

// Edit: Đẩy dữ liệu lên form
window.openEditModal = function(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    modalTitle.textContent = "Chỉnh Sửa Sách";
    inputId.value = book.id;
    inputTitle.value = book.title;
    inputAuthor.value = book.author;
    inputCategory.value = book.category;
    inputStatus.value = book.status;

    openModal(modalForm);
}

// Xóa sách
window.deleteBook = function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sách này không?")) {
        books = books.filter(b => b.id !== id);
        saveToLocalStorage();
        renderBooks();
    }
}

// Đánh dấu yêu thích (Toggling Heart icon)
window.toggleFavorite = function(id) {
    const index = books.findIndex(b => b.id === id);
    if (index > -1) {
        books[index].isFav = !books[index].isFav;
        saveToLocalStorage();
        renderBooks();
    }
}

// Xem chi tiết sách
window.openDetailModal = function(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    const detailContainer = document.getElementById('detail-info');
    const statusText = book.status === 'available' ? 'Sẵn sàng cho mượn' : 'Đang được mượn';
    const favText = book.isFav ? '❤️ Đã yêu thích' : 'Chưa yêu thích';

    detailContainer.innerHTML = `
        <p><strong>Tên sách:</strong> ${book.title}</p>
        <p><strong>Tác giả:</strong> ${book.author}</p>
        <p><strong>Thể loại:</strong> ${book.category}</p>
        <p><strong>Trạng thái:</strong> ${statusText}</p>
        <p><strong>Yêu thích:</strong> ${favText}</p>
        <p><strong>Mã sách ID:</strong> ${book.id}</p>
    `;

    openModal(modalDetail);
}


// --- 5. LOGIC TÌM KIẾM, LỌC & MODAL UTILS ---

// Bắt sự kiện Gõ phím tìm kiếm và Chọn Filter
inputSearch.addEventListener('input', renderBooks);
selectFilter.addEventListener('change', renderBooks);

// Đóng mở Popup (Modal)
function openModal(modalEl) {
    modalEl.classList.add('show');
}

function closeModal(modalEl) {
    modalEl.classList.remove('show');
}

// Nhấn nút Đóng Modal (Dấu X và nút Hủy)
btnCloseModal.addEventListener('click', () => closeModal(modalForm));
btnCancel.addEventListener('click', () => closeModal(modalForm));

btnCloseDetailIcon.addEventListener('click', () => closeModal(modalDetail));
btnCloseDetailBtn.addEventListener('click', () => closeModal(modalDetail));

// Tắt modal khi click ra lớp phủ (overlay) bên ngoài form
window.addEventListener('click', (e) => {
    if (e.target === modalForm) closeModal(modalForm);
    if (e.target === modalDetail) closeModal(modalDetail);
});


// --- 6. KHỞI CHẠY APP ---
// Hàm này chạy đầu tiên khi load script
function initApp() {
    loadBooks();
    renderBooks(); // Vẽ giao diện
}

initApp();

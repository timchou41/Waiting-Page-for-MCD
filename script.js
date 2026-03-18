// 抓取 HTML 中的元素
const fryBtn = document.getElementById('fry-btn');
const countDisplay = document.getElementById('fry-count');

// 設定初始計數器
let count = 0;

// 當按鈕被點擊時，執行以下動作
fryBtn.addEventListener('click', () => {
    count++; // 數字加 1
    countDisplay.textContent = count; // 更新畫面上的數字
    
    // 增加一點小彩蛋：達到特定數量改變文字
    if (count === 10) {
        alert("哇！你炸了 10 根薯條，薯條大師是你？");
    }
});
// 탭 전환 기능
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.tab;

    // 버튼 active 처리
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // 콘텐츠 표시 전환
    tabContents.forEach((section) => {
      if (section.id === targetId) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });

    // 탭 이동 시 스크롤을 상단으로 약간 올려 주기 (모바일 UX)
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});

// 캐러셀 기능
const productCards = document.querySelectorAll(".product-card");
const prevBtn = document.querySelector(".carousel-arrow.prev");
const nextBtn = document.querySelector(".carousel-arrow.next");
const dots = document.querySelectorAll(".dot");

let currentIndex = 0;

function showProduct(index) {
  // index 범위 보정
  if (index < 0) {
    index = productCards.length - 1;
  } else if (index >= productCards.length) {
    index = 0;
  }
  currentIndex = index;

  productCards.forEach((card, i) => {
    card.classList.toggle("active", i === currentIndex);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentIndex);
  });
}

if (prevBtn && nextBtn && productCards.length > 0) {
  prevBtn.addEventListener("click", () => {
    showProduct(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    showProduct(currentIndex + 1);
  });
}

// 점(인디케이터) 클릭 시 이동
dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = Number(dot.dataset.index);
    showProduct(index);
  });
});

// 초기 상태
showProduct(0);

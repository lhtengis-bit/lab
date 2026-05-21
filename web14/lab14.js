var slideIndex = 1;

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    var slides = document.getElementsByClassName("mySlides");
    var thumbs = document.getElementsByClassName("column");
    var caption = document.getElementById("caption");

    // Хязгаар шалгах
    if (n > slides.length) slideIndex = 1;
    if (n < 1) slideIndex = slides.length;

    // Бүх слайдыг нуух
    for (var i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
    }

    // Бүх жижиг зургийн active-г арилгах
    for (var i = 0; i < thumbs.length; i++) {
        thumbs[i].classList.remove("active");
    }

    // Одоогийн слайдыг харуулах
    slides[slideIndex - 1].classList.add("active");
    thumbs[slideIndex - 1].classList.add("active");

    // Тайлбар шинэчлэх
    var img = thumbs[slideIndex - 1].querySelector("img");
    caption.textContent = img ? img.alt : "";
}

// Гарын товч ашиглах (Зүүн, баруун сум)
document.addEventListener("keydown", function(e) {
    if (e.key === "ArrowLeft")  plusSlides(-1);
    if (e.key === "ArrowRight") plusSlides(1);
});
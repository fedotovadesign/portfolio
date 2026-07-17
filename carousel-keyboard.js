/* Carousel: keyboard arrows when hovered or focused */
(function () {
  var carousels = document.querySelectorAll("[data-carousel]");
  if (!carousels.length) return;

  carousels.forEach(function (carousel) {
    var viewport = carousel.querySelector(".design-carousel__viewport");
    var prevBtn = carousel.querySelector(".design-carousel__btn--prev");
    var nextBtn = carousel.querySelector(".design-carousel__btn--next");
    if (!viewport) return;

    var hovered = false;

    carousel.addEventListener("pointerenter", function () {
      hovered = true;
    });
    carousel.addEventListener("pointerleave", function () {
      hovered = false;
    });

    function step(delta) {
      if (delta < 0 && prevBtn) prevBtn.click();
      else if (delta > 0 && nextBtn) nextBtn.click();
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      var target = event.target;
      var tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select" || (target && target.isContentEditable)) {
        return;
      }

      var focusedInside = carousel.contains(document.activeElement);
      if (!hovered && !focusedInside) return;

      event.preventDefault();
      step(event.key === "ArrowLeft" ? -1 : 1);
    });
  });
})();

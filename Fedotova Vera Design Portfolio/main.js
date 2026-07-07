(function () {
  function setNavActive() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    var hash = window.location.hash;
    var isHome = path === "" || path === "index.html";

    document.querySelectorAll(".nav-links a").forEach(function (link) {
      link.classList.remove("active");
      var href = link.getAttribute("href") || "";
      var linkHash = href.indexOf("#") !== -1 ? href.slice(href.indexOf("#")) : "";

      if (isHome) {
        if ((href === "index.html" || href === "./index.html") && !hash) {
          link.classList.add("active");
        } else if (href === "#projects" && hash === "#projects") {
          link.classList.add("active");
        } else if (href === "#experience" && hash === "#experience") {
          link.classList.add("active");
        } else if (href === "#contact" && hash === "#contact") {
          link.classList.add("active");
        }
        return;
      }

      if (linkHash) return;

      if (href === path || (path === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  setNavActive();
  window.addEventListener("hashchange", setNavActive);
})();

(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var root = document.createElement("div");
  root.className = "site-cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<span class="site-cursor-ring"></span>';
  document.body.appendChild(root);
  document.body.classList.add("has-custom-cursor");

  var ring = root.querySelector(".site-cursor-ring");
  var visible = false;

  var interactiveSelector =
    "a, button, .btn, .btn-round, .nav-cv, .case-accordion-trigger, .ux-flow-toggle, .design-carousel__btn, .design-carousel__dot, input, textarea, select, label[for], .project-card, .contact-link";

  function setVisible(state) {
    visible = state;
    root.classList.toggle("is-visible", state);
  }

  function setHover(state) {
    root.classList.toggle("is-hover", state);
  }

  function movePointer(x, y) {
    ring.style.transform = "translate3d(" + x + "px, " + y + "px, 0) translate(-50%, -50%)";
  }

  document.addEventListener(
    "mousemove",
    function (e) {
      if (!visible) setVisible(true);
      movePointer(e.clientX, e.clientY);
      setHover(!!e.target.closest(interactiveSelector));
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", function () { setVisible(false); }, { passive: true });

  movePointer(window.innerWidth / 2, window.innerHeight / 2);
})();

(function () {
  var PRETTY_SELECTOR =
    ".hero-lead, .section-lead, .case-hero .section-lead, .case-hero-note, .case-block p, .case-block-subtitle, .case-block-lead, .about-item p, .about-entry-text, .project-card-text, .stat-label, .discover-box-body p, .discover-bar-label, .discover-chart-note, .develop-text, .develop-ab-caption, .case-meta dd";
  var SHORT_WORDS =
    /^(a|an|and|as|at|be|by|for|if|in|is|it|my|no|of|on|or|so|to|up|us|we|the|via|per|out|off|but|yet|nor|how|who|why|all|any|its|she|he|am|do|with|from|into|that|this|also|both|each|not|can|may|our|your|was|were|has|have|had|than|then|them|they|their|there|over|under|about|after|before|between|through|during|without|within|along|across|among|against|toward|towards|like|such|once|while|where|when|what|which|whose|whom|because|although|though|until|unless|since|upon|onto|into|despite|except|plus|minus|near|past|plus|e\.g|i\.e|vs)$/i;
  var resizeTimer;

  function wordCore(word) {
    return word.replace(/^[^\w]+|[^\w]+$/g, "");
  }

  function shouldBind(word) {
    var core = wordCore(word);
    if (!core) return false;
    if (core.length <= 2) return true;
    if (core.length <= 4 && SHORT_WORDS.test(core)) return true;
    return SHORT_WORDS.test(core);
  }

  function polishText(original) {
    var words = original.split(/\s+/);
    if (!words.length) return original;

    var result = [];
    var i = 0;

    while (i < words.length) {
      var word = words[i];
      var next = words[i + 1];
      var next2 = words[i + 2];

      if (next && shouldBind(word)) {
        if (next2 && shouldBind(next)) {
          result.push(word + "\u00A0" + next + "\u00A0" + next2);
          i += 3;
          continue;
        }

        result.push(word + "\u00A0" + next);
        i += 2;
        continue;
      }

      if (next && shouldBind(next)) {
        result.push(word + "\u00A0" + next);
        i += 2;
        continue;
      }

      result.push(word);
      i += 1;
    }

    if (result.length >= 2) {
      var last = result.pop();
      var prev = result.pop();
      result.push(prev + "\u00A0" + last);
    }

    return result.join(" ");
  }

  function polishMixedElement(el) {
    var cacheKey = "data-pretty-mixed";
    var sources;

    if (!el.hasAttribute(cacheKey)) {
      sources = [];
      Array.prototype.forEach.call(el.childNodes, function (node) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          sources.push(node.textContent.replace(/\s+/g, " ").trim());
        }
      });
      el.setAttribute(cacheKey, JSON.stringify(sources));
    } else {
      sources = JSON.parse(el.getAttribute(cacheKey));
    }

    var index = 0;
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;

      var leading = node.textContent.match(/^\s*/)[0];
      var original = sources[index];
      index += 1;
      node.textContent = leading + polishText(original);
    });
  }

  function polishParagraph(el) {
    if (!el) return;

    if (el.children.length) {
      polishMixedElement(el);
      return;
    }

    var original = el.getAttribute("data-pretty-source");
    if (!original) {
      original = el.textContent.replace(/\s+/g, " ").trim();
      el.setAttribute("data-pretty-source", original);
    }

    el.textContent = polishText(original);
  }

  function polishAll() {
    document.querySelectorAll(PRETTY_SELECTOR).forEach(polishParagraph);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", polishAll);
  } else {
    polishAll();
  }

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(polishAll, 150);
  });
})();

(function () {
  var accordion = document.querySelector(".case-accordion");
  if (!accordion) return;

  var items = Array.prototype.slice.call(
    accordion.querySelectorAll(".case-accordion-item")
  );
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var duration = 460;
  var easing = "cubic-bezier(0.33, 1, 0.68, 1)";

  function prefersReduced() {
    return motionQuery.matches;
  }

  function getDuration() {
    return prefersReduced() ? 0 : duration;
  }

  function ensurePanelInner(panel) {
    var inner = panel.querySelector(".case-accordion-panel-inner");
    if (inner) return inner;

    inner = document.createElement("div");
    inner.className = "case-accordion-panel-inner";
    while (panel.firstChild) {
      inner.appendChild(panel.firstChild);
    }
    panel.appendChild(inner);
    return inner;
  }

  function preparePanel(panel) {
    if (!panel || panel.dataset.accordionReady === "true") return;

    panel.dataset.accordionReady = "true";
    ensurePanelInner(panel);
    panel.hidden = false;
    panel.style.overflow = "hidden";
    panel.style.transition = "height " + getDuration() + "ms " + easing;
    panel.style.height = panel
      .closest(".case-accordion-item")
      .classList.contains("is-open")
      ? "auto"
      : "0px";
    panel.setAttribute(
      "aria-hidden",
      panel.closest(".case-accordion-item").classList.contains("is-open")
        ? "false"
        : "true"
    );
  }

  function measurePanel(panel) {
    var current = panel.style.height;
    panel.style.height = "auto";
    var height = panel.scrollHeight;
    panel.style.height = current;
    return height;
  }

  function onTransitionEnd(panel, callback) {
    function handler(event) {
      if (event.target !== panel || event.propertyName !== "height") return;
      panel.removeEventListener("transitionend", handler);
      callback();
    }

    panel.addEventListener("transitionend", handler);
  }

  function setItemState(item, open, animate) {
    var trigger = item.querySelector(".case-accordion-trigger");
    var panel = item.querySelector(".case-accordion-panel");
    if (!trigger || !panel) return;

    preparePanel(panel);
    var ms = animate && !prefersReduced() ? getDuration() : 0;
    panel.style.transition = ms ? "height " + ms + "ms " + easing : "none";

    item.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");

    if (ms === 0) {
      panel.style.height = open ? "auto" : "0px";
      return;
    }

    if (open) {
      var startHeight =
        panel.style.height === "auto"
          ? measurePanel(panel)
          : parseFloat(panel.style.height) || 0;
      panel.style.height = startHeight + "px";
      panel.offsetHeight;
      panel.style.height = measurePanel(panel) + "px";
      onTransitionEnd(panel, function () {
        if (item.classList.contains("is-open")) {
          panel.style.height = "auto";
        }
      });
      return;
    }

    if (panel.style.height === "auto") {
      panel.style.height = measurePanel(panel) + "px";
    }
    panel.offsetHeight;
    panel.style.height = "0px";
  }

  function getNavOffset() {
    var navOffset = 88;
    var navVar = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--nav-h")
    );
    if (!isNaN(navVar) && navVar > 0) navOffset = navVar + 16;
    return navOffset;
  }

  function getTriggerScrollTop(item) {
    var trigger = item.querySelector(".case-accordion-trigger");
    if (!trigger) return 0;

    return Math.max(0, trigger.getBoundingClientRect().top + window.scrollY - getNavOffset());
  }

  function openAccordionItem(item, panel) {
    items.forEach(function (entry) {
      if (entry !== item && entry.classList.contains("is-open")) {
        setItemState(entry, false, false);
      }
    });

    window.scrollTo({
      top: getTriggerScrollTop(item),
      behavior: "auto",
    });

    setItemState(item, true, true);
  }

  items.forEach(function (item) {
    var panel = item.querySelector(".case-accordion-panel");
    var trigger = item.querySelector(".case-accordion-trigger");
    if (!panel) return;

    var initiallyOpen =
      item.classList.contains("is-open") ||
      (trigger && trigger.getAttribute("aria-expanded") === "true");

    preparePanel(panel);
    panel.removeAttribute("hidden");

    if (initiallyOpen) {
      item.classList.add("is-open");
      panel.style.height = "auto";
      panel.setAttribute("aria-hidden", "false");
      if (trigger) trigger.setAttribute("aria-expanded", "true");
      return;
    }

    panel.style.height = "0px";
    panel.setAttribute("aria-hidden", "true");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });

  items.forEach(function (item) {
    var trigger = item.querySelector(".case-accordion-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function () {
      var panel = item.querySelector(".case-accordion-panel");
      var isOpen = item.classList.contains("is-open");

      if (isOpen) {
        setItemState(item, false, true);
        return;
      }

      if (!panel) return;

      openAccordionItem(item, panel);
    });
  });

  window.addEventListener("resize", function () {
    items.forEach(function (item) {
      if (!item.classList.contains("is-open")) return;

      var panel = item.querySelector(".case-accordion-panel");
      if (!panel) return;

      panel.style.transition = "none";
      panel.style.height = "auto";
      panel.offsetHeight;
      panel.style.transition = "height " + getDuration() + "ms " + easing;
    });
  });
})();

(function () {
  var flows = document.querySelectorAll(".ux-flow--collapsible");
  if (!flows.length) return;

  flows.forEach(function (flow) {
    var trigger = flow.querySelector(".ux-flow-toggle");
    var panel = flow.querySelector(".ux-flow-panel");
    if (!trigger || !panel) return;

    function setOpen(open) {
      flow.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }

    trigger.addEventListener("click", function () {
      setOpen(!flow.classList.contains("is-open"));
    });
  });
})();

(function () {
  document.querySelectorAll(".erp-flow-video__player").forEach(function (video) {
    video.muted = true;
    video.setAttribute("playsinline", "");
    function tryPlay() {
      var p = video.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    if (video.readyState >= 2) tryPlay();
    else video.addEventListener("loadeddata", tryPlay, { once: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tryPlay();
    });
  });
})();

(function () {
  var carousels = document.querySelectorAll("[data-carousel]");
  if (!carousels.length) return;

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  carousels.forEach(function (carousel) {
    var viewport = carousel.querySelector(".design-carousel__viewport");
    var track = carousel.querySelector(".design-carousel__track");
    var slides = Array.prototype.slice.call(
      carousel.querySelectorAll(".design-carousel__slide")
    );
    var prevBtn = carousel.querySelector(".design-carousel__btn--prev");
    var nextBtn = carousel.querySelector(".design-carousel__btn--next");
    var dotsRoot = carousel.querySelector(".design-carousel__dots");
    var label = carousel.querySelector("[data-carousel-label]");
    var captionTitle = carousel.querySelector("[data-carousel-title]");
    var captionText = carousel.querySelector("[data-carousel-text]");
    if (!viewport || !track || !slides.length || !dotsRoot) return;

    var index = 0;
    var pointerStartX = 0;
    var pointerStartY = 0;
    var pointerId = null;

    slides.forEach(function (slide, slideIndex) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "design-carousel__dot" + (slideIndex === 0 ? " is-active" : "");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Go to screen " + (slideIndex + 1));
      dot.setAttribute("aria-selected", slideIndex === 0 ? "true" : "false");
      dot.addEventListener("click", function () {
        goTo(slideIndex);
      });
      dotsRoot.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(
      dotsRoot.querySelectorAll(".design-carousel__dot")
    );

    function goTo(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = "translate3d(" + -index * 100 + "%, 0, 0)";

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        var active = dotIndex === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;

      if (label) {
        label.textContent = slides[index].getAttribute("data-caption") || "";
      }

      if (captionTitle) {
        captionTitle.textContent = slides[index].getAttribute("data-caption") || "";
      }

      if (captionText) {
        captionText.textContent = slides[index].getAttribute("data-description") || "";
      }
    }

    function step(delta) {
      goTo(index + delta);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        step(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        step(1);
      });
    }

    viewport.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    });

    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
    });

    viewport.addEventListener("pointerup", function (event) {
      if (pointerId !== event.pointerId) return;

      var deltaX = event.clientX - pointerStartX;
      var deltaY = event.clientY - pointerStartY;
      pointerId = null;

      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      step(deltaX < 0 ? 1 : -1);
    });

    viewport.addEventListener("pointercancel", function () {
      pointerId = null;
    });

    if (motionQuery.matches) {
      track.style.transition = "none";
    }

    goTo(0);
  });
})();

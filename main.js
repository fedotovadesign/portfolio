(function () {
  if (new URLSearchParams(window.location.search).has("embed")) {
    document.documentElement.classList.add("case-embed");
  }
})();

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
  var path = window.location.pathname.split("/").pop() || "index.html";
  var isHome = path === "" || path === "index.html";
  if (!isHome) return;

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var scrollFrame = null;
  var scrollToken = 0;

  document.documentElement.classList.add("nav-smooth-scroll");

  function getNavOffset() {
    var navVar = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--nav-h")
    );
    return (isNaN(navVar) ? 64 : navVar) + 24;
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function getScrollDuration(distance) {
    return Math.min(Math.max(Math.abs(distance) * 0.72, 640), 1400);
  }

  function smoothScrollToY(targetY) {
    if (motionQuery.matches) {
      window.scrollTo(0, targetY);
      return;
    }

    scrollToken += 1;
    var token = scrollToken;

    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }

    var startY = window.scrollY || window.pageYOffset || 0;
    var distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    var duration = getScrollDuration(distance);
    var startTime = null;

    function step(now) {
      if (token !== scrollToken) return;

      if (!startTime) startTime = now;
      var progress = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutSine(progress));

      if (progress < 1) {
        scrollFrame = requestAnimationFrame(step);
      } else {
        scrollFrame = null;
        window.scrollTo(0, targetY);
      }
    }

    scrollFrame = requestAnimationFrame(step);
  }

  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      var target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();

      var top =
        target.getBoundingClientRect().top +
        (window.scrollY || window.pageYOffset || 0) -
        getNavOffset();

      smoothScrollToY(Math.max(0, top));

      if (window.location.hash !== hash) {
        history.pushState(null, "", hash);
        window.dispatchEvent(new Event("hashchange"));
      }
    });
  });
})();

(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var interactiveSelector =
    'a[href], button:not(:disabled), summary, label[for], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [role="button"], [role="link"], [tabindex]:not([tabindex="-1"]), .btn, .btn-round, .nav-cv, .logo, .nav-links a, .case-accordion-trigger, .ux-flow-toggle, .design-carousel__btn, .design-carousel__dot, .project-case:not(.project-case--static), .project-card, .contact-link, .contact-tonik-email, .contact-tonik-social, .case-panel__close, .case-panel__backdrop, .figma-modal__close, .figma-modal__backdrop, [data-figma-open], [data-figma-close], [data-case-panel-close], .about-row-head, .about-row > summary';

  function isInteractiveTarget(target) {
    if (!target || !target.closest) return false;
    if (target.closest(".project-case--static")) return false;
    return !!target.closest(interactiveSelector);
  }

  var isEmbedFrame =
    window.parent !== window &&
    new URLSearchParams(window.location.search).has("embed");

  if (isEmbedFrame) {
    document.addEventListener(
      "mousemove",
      function (e) {
        window.parent.postMessage(
          {
            type: "portfolio-cursor",
            event: "move",
            x: e.clientX,
            y: e.clientY,
            interactive: isInteractiveTarget(e.target),
          },
          "*"
        );
      },
      { passive: true }
    );

    document.documentElement.addEventListener(
      "mouseleave",
      function () {
        window.parent.postMessage({ type: "portfolio-cursor", event: "leave" }, "*");
      },
      { passive: true }
    );

    return;
  }

  var root = document.createElement("div");
  root.className = "site-cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<span class="site-cursor-ring"></span>';
  document.body.appendChild(root);
  document.body.classList.add("has-custom-cursor");

  var ring = root.querySelector(".site-cursor-ring");
  var visible = false;

  function setVisible(state) {
    visible = state;
    root.classList.toggle("is-visible", state);
  }

  function setPointer(state) {
    root.classList.toggle("is-pointer", state);
  }

  function movePointer(x, y) {
    ring.style.transform =
      "translate3d(" + x + "px, " + y + "px, 0) translate(-50%, -50%)";
  }

  document.addEventListener(
    "mousemove",
    function (e) {
      if (!visible) setVisible(true);
      movePointer(e.clientX, e.clientY);
      setPointer(isInteractiveTarget(e.target));
    },
    { passive: true }
  );

  document.addEventListener(
    "mouseleave",
    function () {
      setVisible(false);
    },
    { passive: true }
  );

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "portfolio-cursor") return;

    var panel = document.getElementById("case-panel");
    var frame = panel && panel.querySelector(".case-panel__frame");
    if (!frame || event.source !== frame.contentWindow) return;

    if (event.data.event === "leave") return;

    if (event.data.event === "move") {
      var rect = frame.getBoundingClientRect();
      if (!visible) setVisible(true);
      movePointer(rect.left + event.data.x, rect.top + event.data.y);
      setPointer(!!event.data.interactive);
      frame.style.cursor = event.data.interactive ? "pointer" : "none";
    }
  });

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

  function preventDotLineStart(text) {
    return text.replace(/ · /g, "\u00A0· ");
  }

  function polishDotSeparated(el) {
    if (!el) return;

    var original = el.getAttribute("data-dot-source");
    if (!original) {
      original = el.textContent.replace(/\s+/g, " ").trim();
      el.setAttribute("data-dot-source", original);
    }

    el.textContent = preventDotLineStart(original);
  }

  function polishAll() {
    document.querySelectorAll(PRETTY_SELECTOR).forEach(polishParagraph);
    document
      .querySelectorAll(".experience-timeline-text, .experience-timeline-org")
      .forEach(polishDotSeparated);
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
  var aboutAccordion = document.querySelector(".about-accordion");
  if (!aboutAccordion) return;

  var rows = Array.prototype.slice.call(aboutAccordion.querySelectorAll(".about-row"));
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var duration = 560;
  var easing = "cubic-bezier(0.22, 1, 0.36, 1)";

  function prefersReduced() {
    return motionQuery.matches;
  }

  function getDuration() {
    return prefersReduced() ? 0 : duration;
  }

  function ensureBodyInner(body) {
    var inner = body.querySelector(".about-row-body-inner");
    if (inner) return inner;

    inner = document.createElement("div");
    inner.className = "about-row-body-inner";
    while (body.firstChild) {
      inner.appendChild(body.firstChild);
    }
    body.appendChild(inner);
    return inner;
  }

  function measureBody(body) {
    var current = body.style.height;
    body.style.height = "auto";
    var height = body.scrollHeight;
    body.style.height = current;
    return height;
  }

  function onHeightTransitionEnd(body, callback) {
    function handler(event) {
      if (event.target !== body || event.propertyName !== "height") return;
      body.removeEventListener("transitionend", handler);
      callback();
    }

    body.addEventListener("transitionend", handler);
  }

  function prepareRow(row) {
    var body = row.querySelector(".about-row-body");
    if (!body || body.dataset.aboutReady === "true") return body;

    body.dataset.aboutReady = "true";
    ensureBodyInner(body);
    body.style.overflow = "hidden";
    body.style.transition = "height " + getDuration() + "ms " + easing;
    body.style.height = row.open ? "auto" : "0px";
    return body;
  }

  function setRowState(row, open, animate) {
    var body = prepareRow(row);
    if (!body) return;

    var ms = animate && !prefersReduced() ? getDuration() : 0;
    body.style.transition = ms ? "height " + ms + "ms " + easing : "none";

    if (open) {
      row.setAttribute("open", "");

      if (ms === 0) {
        body.style.height = "auto";
        return;
      }

      body.style.height = "0px";
      body.offsetHeight;
      body.style.height = measureBody(body) + "px";
      onHeightTransitionEnd(body, function () {
        if (row.open) body.style.height = "auto";
      });
      return;
    }

    if (ms === 0) {
      row.removeAttribute("open");
      body.style.height = "0px";
      return;
    }

    if (body.style.height === "auto") {
      body.style.height = measureBody(body) + "px";
    }

    body.offsetHeight;
    body.style.height = "0px";
    onHeightTransitionEnd(body, function () {
      if (!row.open) return;
      row.removeAttribute("open");
    });
  }

  rows.forEach(function (row) {
    var summary = row.querySelector(".about-row-head");
    if (!summary) return;

    prepareRow(row);

    summary.addEventListener("click", function (event) {
      event.preventDefault();
      setRowState(row, !row.open, true);
    });
  });

  window.addEventListener("resize", function () {
    rows.forEach(function (row) {
      if (!row.open) return;

      var body = row.querySelector(".about-row-body");
      if (!body) return;

      body.style.transition = "none";
      body.style.height = "auto";
      body.offsetHeight;
      body.style.transition = "height " + getDuration() + "ms " + easing;
    });
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

(function () {
  var openButtons = document.querySelectorAll("[data-figma-open]");
  if (!openButtons.length) return;

  var activeModal = null;
  var lastTrigger = null;

  function loadIframe(modal) {
    var iframe = modal.querySelector("iframe[data-figma-src]");
    if (!iframe || iframe.src) return;
    iframe.src = iframe.getAttribute("data-figma-src");
  }

  function openModal(modal, trigger) {
    if (!modal) return;

    activeModal = modal;
    lastTrigger = trigger || null;
    loadIframe(modal);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("figma-modal-open");

    var closeBtn = modal.querySelector(".figma-modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("figma-modal-open");

    if (activeModal === modal) activeModal = null;

    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  openButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var modal = document.getElementById(button.getAttribute("data-figma-open"));
      if (!modal) return;
      openModal(modal, button);
    });
  });

  document.querySelectorAll("[data-figma-close]").forEach(function (control) {
    control.addEventListener("click", function () {
      closeModal(control.closest(".figma-modal"));
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && activeModal) {
      closeModal(activeModal);
    }
  });
})();

(function () {
  var panel = document.getElementById("case-panel");
  if (!panel) return;

  var desktopMq = window.matchMedia("(min-width: 901px)");
  var motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var frame = panel.querySelector(".case-panel__frame");
  var inline = document.getElementById("case-panel-enoterra");
  var closeDuration = 520;
  var lastTrigger = null;
  var lockedScrollY = 0;
  var panelToken = 0;
  var frameLoadTimer = null;

  function isDesktop() {
    return desktopMq.matches;
  }

  function getCloseDuration() {
    return motionMq.matches ? 0 : closeDuration;
  }

  function getScrollbarWidth() {
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  }

  function lockPageScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    var scrollbarWidth = getScrollbarWidth();

    document.documentElement.classList.add("case-panel-open");
    document.body.classList.add("case-panel-open");

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = scrollbarWidth + "px";
    }
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove("case-panel-open");
    document.body.classList.remove("case-panel-open");
    document.body.style.paddingRight = "";
    window.scrollTo(0, lockedScrollY);
  }

  function resetFrame() {
    if (!frame) return;

    frame.classList.remove("is-ready");
    frame.removeAttribute("src");
  }

  function onFrameReady(token) {
    if (!frame || token !== panelToken || !panel.classList.contains("is-open")) return;
    frame.classList.add("is-ready");
  }

  function isPanelScrollTarget(target) {
    if (!target || !panel.classList.contains("is-open")) return false;

    var drawer = panel.querySelector(".case-panel__drawer");
    var closeBtn = panel.querySelector(".case-panel__close");
    if (closeBtn && (target === closeBtn || closeBtn.contains(target))) return true;
    return !!(drawer && drawer.contains(target));
  }

  function preventBackgroundScroll(event) {
    if (!panel.classList.contains("is-open") || panel.hidden) return;
    if (isPanelScrollTarget(event.target)) return;
    event.preventDefault();
  }

  function openPanel(trigger) {
    var href = trigger.getAttribute("href") || "";
    var token = ++panelToken;

    if (frameLoadTimer) {
      window.clearTimeout(frameLoadTimer);
      frameLoadTimer = null;
    }

    lastTrigger = trigger;
    resetFrame();

    if (inline) inline.hidden = true;
    if (frame) frame.hidden = false;

    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    panel.classList.remove("is-open");
    lockPageScroll();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (token !== panelToken) return;
        panel.classList.add("is-open");
      });
    });

    if (frame) {
      var url = href.split("#")[0];
      var embedUrl = url + (url.indexOf("?") !== -1 ? "&" : "?") + "embed=1";

      frame.addEventListener(
        "load",
        function handleFrameLoad() {
          frame.removeEventListener("load", handleFrameLoad);
          onFrameReady(token);
        }
      );

      frameLoadTimer = window.setTimeout(function () {
        frameLoadTimer = null;
        if (token !== panelToken || !panel.classList.contains("is-open")) return;
        frame.src = embedUrl;
      }, motionMq.matches ? 0 : 120);
    }
  }

  function closePanel(options) {
    options = options || {};
    panelToken += 1;

    if (frameLoadTimer) {
      window.clearTimeout(frameLoadTimer);
      frameLoadTimer = null;
    }

    if (frame) frame.classList.remove("is-ready");
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    unlockPageScroll();

    window.setTimeout(function () {
      if (panel.classList.contains("is-open")) return;

      panel.hidden = true;
      resetFrame();
      if (inline) inline.hidden = true;
    }, getCloseDuration());

    if (lastTrigger) {
      if (options.restoreFocus) {
        lastTrigger.focus({ preventScroll: true });
      } else {
        lastTrigger.blur();
      }
      lastTrigger = null;
    }
  }

  document.querySelectorAll(".project-case:not(.project-case--static)").forEach(function (card) {
    card.addEventListener("click", function (event) {
      if (!isDesktop()) return;

      event.preventDefault();
      openPanel(card);
    });
  });

  panel.querySelectorAll("[data-case-panel-close]").forEach(function (control) {
    control.addEventListener("click", function () {
      closePanel();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden && panel.classList.contains("is-open")) {
      event.preventDefault();
      closePanel({ restoreFocus: true });
    }
  });

  document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
  document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

  desktopMq.addEventListener("change", function () {
    if (!desktopMq.matches && panel.classList.contains("is-open")) {
      closePanel();
    }
  });
})();

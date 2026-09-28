(() => {
  "use strict";

  const list = document.querySelector("[data-article-list]");
  const status = document.querySelector("[data-article-status]");
  if (!list || !status) return;

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "ready";
  };

  const articleCard = (item) => {
    const article = document.createElement("article");
    article.className = "article-card";

    const meta = document.createElement("div");
    meta.className = "article-card__meta";
    meta.textContent = item.category;

    const heading = document.createElement("h2");
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.title;
    heading.append(link);

    const summary = document.createElement("p");
    summary.textContent = item.summary;

    const action = document.createElement("span");
    action.className = "article-card__action";
    action.textContent = "Читать материал →";

    article.append(meta, heading, summary, action);
    return article;
  };

  const isArticle = (item) => item && typeof item === "object"
    && typeof item.title === "string" && item.title.length > 0 && item.title.length <= 240
    && typeof item.summary === "string" && item.summary.length > 0 && item.summary.length <= 320
    && typeof item.category === "string" && item.category.length > 0 && item.category.length <= 120
    && typeof item.href === "string" && /^\.\/[a-z0-9][a-z0-9-]{2,100}\/$/u.test(item.href);

  const materialWord = (count) => {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "материалов";
    if (last === 1) return "материал";
    if (last >= 2 && last <= 4) return "материала";
    return "материалов";
  };

  fetch("feed.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((feed) => {
      if (feed?.schemaVersion !== "stageone-articles-v1" || !Array.isArray(feed.items)
        || feed.items.length > 500 || !feed.items.every(isArticle)) {
        throw new Error("Некорректный формат ленты");
      }
      if (feed.items.length === 0) {
        setStatus("Первые материалы готовятся к публикации.");
        return;
      }
      const fragment = document.createDocumentFragment();
      for (const item of feed.items) fragment.append(articleCard(item));
      list.replaceChildren(fragment);
      setStatus(`${feed.items.length} ${materialWord(feed.items.length)}`);
    })
    .catch(() => setStatus("Не удалось загрузить список материалов. Попробуйте обновить страницу.", true));
})();

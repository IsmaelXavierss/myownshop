(() => {
  const products = [
    {
      id: "christmas-tree",
      name: "Árvore de Natal com luzes",
      category: "christmas-tree",
      icon: "🎄",
      optionLabel: "Altura da árvore",
      styleLabel: "Cor das luzes",
      variants: [
        { id: "6ft", label: "1,8 m", price: 249.99 },
        { id: "7-5ft", label: "2,3 m", price: 399.99 },
        { id: "9ft", label: "2,7 m", price: 599.99 }
      ],
      styles: ["Branco quente", "Coloridas"]
    },
    {
      id: "string-lights",
      name: "Pisca-pisca de LED",
      category: "string-lights",
      icon: "✨",
      optionLabel: "Quantidade de luzes",
      styleLabel: "Cor das luzes",
      variants: [
        { id: "100", label: "100 luzes", price: 24.99 },
        { id: "300", label: "300 luzes", price: 49.99 },
        { id: "600", label: "600 luzes", price: 89.99 }
      ],
      styles: ["Branco quente", "Coloridas"]
    },
    {
      id: "ornaments",
      name: "Conjunto de bolas de Natal",
      category: "ornaments",
      icon: "🔴",
      optionLabel: "Quantidade",
      styleLabel: "Combinação de cores",
      variants: [
        { id: "24", label: "24 unidades", price: 19.99 },
        { id: "48", label: "48 unidades", price: 34.99 },
        { id: "72", label: "72 unidades", price: 49.99 }
      ],
      styles: ["Vermelho e dourado", "Prata e branco", "Mix clássico"]
    },
    {
      id: "wreath",
      name: "Guirlanda natalina",
      category: "wreath",
      icon: "🌿",
      optionLabel: "Diâmetro",
      styleLabel: "Acabamento",
      variants: [
        { id: "20", label: "51 cm", price: 39.99 },
        { id: "24", label: "61 cm", price: 59.99 },
        { id: "30", label: "76 cm", price: 89.99 }
      ],
      styles: ["Verde clássico", "Nevada"]
    },
    {
      id: "stockings",
      name: "Conjunto de meias natalinas",
      category: "stockings",
      icon: "🧦",
      optionLabel: "Quantidade",
      styleLabel: "Combinação de cores",
      variants: [
        { id: "2", label: "Conjunto com 2", price: 24.99 },
        { id: "4", label: "Conjunto com 4", price: 39.99 }
      ],
      styles: ["Vermelho e creme", "Verde e dourado"]
    }
  ];
  const storageKey = "homie-christmas-cart-v1";
  const legacyStyles = {
    "christmas-tree": { "Warm white": "Branco quente", Multicolor: "Coloridas" },
    "string-lights": { "Warm white": "Branco quente", Multicolor: "Coloridas" },
    ornaments: {
      "Red & gold": "Vermelho e dourado",
      "Silver & white": "Prata e branco",
      "Classic mix": "Mix clássico"
    },
    wreath: { "Classic green": "Verde clássico", Frosted: "Nevada" },
    stockings: { "Red & cream": "Vermelho e creme", "Green & gold": "Verde e dourado" }
  };

  function getProduct(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) throw new Error(`Produto desconhecido: ${productId}`);
    return product;
  }

  function getVariant(product, variantId) {
    const variant = product.variants.find(item => item.id === variantId);
    if (!variant) throw new Error(`Opção desconhecida para ${product.name}`);
    return variant;
  }

  function validateCart(cart) {
    if (!Array.isArray(cart)) throw new Error("Os dados salvos do carrinho são inválidos.");
    cart.forEach(item => {
      if (!item || typeof item !== "object") throw new Error("O item salvo no carrinho é inválido.");
      const product = getProduct(item.productId);
      getVariant(product, item.variantId);
      if (!product.styles.includes(item.style)) throw new Error(`Estilo desconhecido para ${product.name}`);
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        throw new Error(`Quantidade inválida para ${product.name}`);
      }
    });
    return cart;
  }

  function saveCart(cart) {
    validateCart(cart);
    localStorage.setItem(storageKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("homie-cart-change", { detail: cart }));
    return cart;
  }

  function getCart() {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) {
      return saveCart([{ productId: "christmas-tree", variantId: "7-5ft", style: "Branco quente", quantity: 1 }]);
    }
    const cart = JSON.parse(saved);
    let migrated = false;
    if (Array.isArray(cart)) {
      cart.forEach(item => {
        const translatedStyle = legacyStyles[item.productId]?.[item.style];
        if (translatedStyle) {
          item.style = translatedStyle;
          migrated = true;
        }
      });
    }
    return migrated ? saveCart(cart) : validateCart(cart);
  }

  function addItem(productId, variantId, style) {
    const product = getProduct(productId);
    getVariant(product, variantId);
    if (!product.styles.includes(style)) throw new Error(`Estilo desconhecido para ${product.name}`);
    const cart = getCart();
    const existing = cart.find(item =>
      item.productId === productId && item.variantId === variantId && item.style === style
    );
    if (existing) {
      if (existing.quantity >= 99) throw new Error("A quantidade do produto não pode passar de 99.");
      existing.quantity += 1;
    } else {
      cart.push({ productId, variantId, style, quantity: 1 });
    }
    return saveCart(cart);
  }

  function updateQuantity(index, quantity) {
    const cart = getCart();
    if (!Number.isInteger(index) || !cart[index]) throw new Error("Item não encontrado no carrinho.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("A quantidade deve estar entre 1 e 99.");
    }
    cart[index].quantity = quantity;
    return saveCart(cart);
  }

  function removeItem(index) {
    const cart = getCart();
    if (!Number.isInteger(index) || !cart[index]) throw new Error("Item não encontrado no carrinho.");
    cart.splice(index, 1);
    return saveCart(cart);
  }

  function getItemDetails(item) {
    const product = getProduct(item.productId);
    const variant = getVariant(product, item.variantId);
    return { ...product, variant, price: variant.price, itemTotal: variant.price * item.quantity };
  }

  function getSubtotal(cart = getCart()) {
    return cart.reduce((total, item) => total + getItemDetails(item).itemTotal, 0);
  }

  window.ShopCart = {
    products,
    getCart,
    saveCart,
    addItem,
    updateQuantity,
    removeItem,
    getItemDetails,
    getSubtotal
  };
})();

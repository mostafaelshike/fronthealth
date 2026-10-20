import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Product, Category, Brand } from '../../../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  hero = {
    badge: 'متجر طبي متكامل',
    title: 'كل احتياجاتك الطبية في مكان واحد',
    description:
      'اكتشف مجموعة متكاملة من الأجهزة والمستلزمات الطبية عالية الجودة، مع خدمة توصيل سريعة وتجربة شراء سهلة وآمنة.',
    buttonText: 'تسوق الآن',
       image:
      '../../../../../assets/مستلزمات طبية بتصميم أخضر نظيف.png',
  };

  services = [
    {
      icon: 'bi-truck',
      title: 'توصيل سريع',
      description: 'نوصل طلبك حتى باب المنزل أو العيادة بسرعة وأمان.'
    },
    {
      icon: 'bi-patch-check',
      title: 'منتجات موثوقة',
      description: 'منتجات طبية مختارة بعناية من أفضل العلامات التجارية.'
    },
    {
      icon: 'bi-shield-check',
      title: 'جودة وضمان',
      description: 'نوفر منتجات ذات جودة عالية مع ضمان واضح.'
    },
    {
      icon: 'bi-headset',
      title: 'دعم متواصل',
      description: 'فريق خدمة عملاء جاهز لمساعدتك في اختيار المنتج المناسب.'
    }
  ];

  categories: Category[] = [];
  products: Product[] = [];
  brands: Brand[] = [];
  selectedProduct: Product | null = null;

  loading = true;
  private readonly SHIMMER_TIME = 1000;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHomeData();
  }

  loadHomeData(): void {
    this.loading = true;

    const startTime = Date.now();

    let productsLoaded = false;
    let categoriesLoaded = false;
    let brandsLoaded = false;

    const finishLoading = () => {
      if (!productsLoaded || !categoriesLoaded || !brandsLoaded) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(this.SHIMMER_TIME - elapsed, 0);

      setTimeout(() => {
        this.loading = false;

        // مهم مع Angular الحديثة / zoneless:
        // إجبار الواجهة على التحديث بعد انتهاء الـ timeout.
        this.cdr.detectChanges();
      }, remaining);
    };

    // ================= PRODUCTS =================

    this.productService.getFeaturedProducts(8).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.products = res.data;
        }

        productsLoaded = true;

        // إظهار المنتجات فور وصولها للواجهة.
        this.cdr.detectChanges();

        finishLoading();
      },

      error: (err) => {
        console.error('Error fetching featured products:', err);

        productsLoaded = true;
        this.cdr.detectChanges();

        finishLoading();
      }
    });

    // ================= CATEGORIES =================

    this.categoryService.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data;
        }

        categoriesLoaded = true;
        this.cdr.detectChanges();

        finishLoading();
      },

      error: (err) => {
        console.error('Error fetching categories:', err);

        categoriesLoaded = true;
        this.cdr.detectChanges();

        finishLoading();
      }
    });

    // ================= BRANDS =================

    this.brandService.getBrands().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.brands = res.data;
        }

        brandsLoaded = true;
        this.cdr.detectChanges();

        finishLoading();
      },

      error: (err) => {
        console.error('Error fetching brands:', err);

        brandsLoaded = true;
        this.cdr.detectChanges();

        finishLoading();
      }
    });
  }

  // ================= CART =================

  addToCart(
    product: Product,
    event?: Event
  ): void {
    event?.stopPropagation();

    this.cartService
      .addToCart(product, 1)
      .subscribe({
        next: (res) => {
          this.toastService.show(
            res.localOnly
              ? 'تمت الإضافة محليًا، لكن تعذرت مزامنة السلة مع الحساب'
              : `تمت إضافة "${product.name}" إلى سلة المشتريات`,
            res.localOnly ? 'info' : 'success'
          );
        },

        error: (err) => {
          console.error(
            'Error adding product to cart:',
            err
          );
          this.toastService.show('تعذر إضافة المنتج إلى السلة، حاول مرة أخرى', 'error');
        }
      });
  }

  // ================= WISHLIST =================

  toggleFavorite(
    product: Product,
    event?: Event
  ): void {
    event?.stopPropagation();

    this.wishlistService
      .toggleWishlist(product)
      .subscribe({
        next: (res) => {
          this.toastService.show(
            res.isAdded
              ? 'تمت إضافة المنتج إلى المفضلة'
              : 'تمت إزالة المنتج من المفضلة'
          );
        },

        error: (err) => {
          console.error(
            'Error updating wishlist:',
            err
          );
          this.toastService.show('تعذر تحديث المفضلة، حاول مرة أخرى', 'error');
        }
      });
  }

  isFav(product: Product): boolean {
    return this.wishlistService.isFavorite(
      product._id || product.id || ''
    );
  }

  openProduct(product: Product): void {
    this.selectedProduct = product;
  }
}

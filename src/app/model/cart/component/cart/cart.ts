import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CartItem, Order } from '../../../../core/models/models';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  readonly egyptianCities = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'بورسعيد',
    'السويس',
    'الإسماعيلية',
    'دمياط',
    'طنطا',
    'المنصورة',
    'الزقازيق',
    'بنها',
    'شبين الكوم',
    'كفر الشيخ',
    'دمنهور',
    'الفيوم',
    'بني سويف',
    'المنيا',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
    'العريش',
    'مرسى مطروح',
    'الغردقة',
    'الخارجة',
    'طور سيناء',
  ];
  citySearch = '';
  currentStep = 1;
  submittingOrder = false;
  orderCompleted = false;
  createdOrder: Order | null = null;
  errorMessage = '';
  showClearCartDialog = false;
  clearingCart = false;

  shippingData = {
    name: '',
    email: '',
    phone: '',
    hospitalOrClinic: '',
    city: 'القاهرة',
    address: '',
    postalCode: '',
    notes: '',
    paymentMethod: 'cash_on_delivery'
  };

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.shippingData.name = user.name || '';
      this.shippingData.email = user.email || '';
      this.shippingData.phone = user.phone || '';
      this.shippingData.hospitalOrClinic = user.organization || '';
      if (user.address) {
        const savedCity = user.address.city;
        this.shippingData.city =
          savedCity && this.egyptianCities.includes(savedCity) ? savedCity : 'القاهرة';
        this.shippingData.address = user.address.street || '';
        this.shippingData.postalCode = user.address.postalCode || '';
      }
    }
  }

  get filteredEgyptianCities(): string[] {
    const query = this.citySearch.trim();
    return query
      ? this.egyptianCities.filter((city) => city.includes(query))
      : this.egyptianCities;
  }

  get cartItems(): any[] {
    return this.cartService.cartItems().map((item: any) => {
      const p = item.product || {};
      return {
        ...item,
        id: p._id || p.id || '',
        name: p.name || 'منتج طبي معتمد',
        image: p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=600&q=80',
        description: p.description || '',
        tag: p.category?.name || p.category || 'مستلزمات طبية',
        price: item.price || p.price || 0,
        quantity: item.quantity,
        product: p
      };
    });
  }

  get totalItems(): number {
    return this.cartService.itemCount();
  }

  get subtotal(): number {
    return this.cartService.subtotal();
  }

  get tax(): number {
    return this.cartService.tax();
  }

  get total(): number {
    return this.cartService.total();
  }

  getItemTotal(item: any): number {
    const price = item?.price || item?.product?.price || 0;
    return price * (item?.quantity || 1);
  }

  goToStep(step: number): void {
    if (step === 2 && this.cartItems.length === 0) {
      this.toastService.show('سلة المشتريات فارغة', 'info');
      return;
    }

    if (step === 3) {
      const validationMessage = this.validateOrderDetails();
      if (validationMessage) {
        this.errorMessage = validationMessage;
        this.toastService.show(validationMessage, 'info');
        return;
      }
    }

    this.errorMessage = '';
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private validateOrderDetails(): string | null {
    const name = this.shippingData.name.trim();
    const email = this.shippingData.email.trim();
    const phone = this.shippingData.phone.trim();
    const city = this.shippingData.city.trim();
    const address = this.shippingData.address.trim();
    const items = this.cartService.cartItems();

    if (name.length < 2 || name.length > 100) {
      return 'الاسم يجب أن يكون بين حرفين و100 حرف';
    }
    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120)) {
      return 'يرجى إدخال بريد إلكتروني صحيح';
    }
    if (phone.length < 8 || phone.length > 20) {
      return 'رقم الهاتف يجب أن يكون بين 8 و20 حرفاً';
    }
    if (this.shippingData.hospitalOrClinic.trim().length > 150) {
      return 'اسم المنشأة يجب ألا يتجاوز 150 حرفاً';
    }
    if (!this.egyptianCities.includes(city)) {
      return 'يرجى اختيار مدينة من مدن مصر';
    }
    if (address.length < 5 || address.length > 300) {
      return 'العنوان يجب أن يكون بين 5 و300 حرف';
    }
    if (this.shippingData.postalCode.trim().length > 20 || this.shippingData.notes.trim().length > 500) {
      return 'الرمز البريدي أو الملاحظات تجاوزت الحد المسموح';
    }
    if (items.length === 0) {
      return 'سلة المشتريات فارغة';
    }
    if (items.some((item) =>
      !/^[0-9a-fA-F]{24}$/.test(String(item.product?._id || item.product?.id || '')) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 500
    )) {
      return 'تحقق من المنتجات والكميات في السلة قبل إتمام الطلب';
    }
    if (!['cash_on_delivery', 'credit_card', 'bank_transfer', 'mada', 'tabby'].includes(this.shippingData.paymentMethod)) {
      return 'طريقة الدفع غير متاحة';
    }

    return null;
  }

  nextStep(): void {
    this.goToStep(this.currentStep + 1);
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  increaseQty(item: any): void {
    const prodId = item?.product?._id || item?.product?.id || item?.id || '';
    this.cartService.updateQuantity(prodId, item.quantity + 1).subscribe();
  }

  decreaseQty(item: any): void {
    const prodId = item?.product?._id || item?.product?.id || item?.id || '';
    this.cartService.updateQuantity(prodId, item.quantity - 1).subscribe();
  }

  increaseQuantity(item: any): void {
    this.increaseQty(item);
  }

  decreaseQuantity(item: any): void {
    this.decreaseQty(item);
  }

  removeItem(idOrItem: any): void {
    const id = typeof idOrItem === 'string' ? idOrItem : (idOrItem?.product?._id || idOrItem?.product?.id || idOrItem?.id || '');
    if (id) {
      this.cartService.removeFromCart(id).subscribe();
    }
  }

  clearCart(): void {
    this.showClearCartDialog = true;
  }

  closeClearCartDialog(): void {
    if (!this.clearingCart) this.showClearCartDialog = false;
  }

  confirmClearCart(): void {
    if (this.clearingCart) return;

    this.clearingCart = true;
    this.cartService.clearCart().subscribe({
      next: () => {
        this.clearingCart = false;
        this.showClearCartDialog = false;
        this.toastService.show('تم تفريغ السلة بالكامل');
      },
      error: (err) => {
        this.clearingCart = false;
        this.toastService.show(err.message || 'تعذر تفريغ السلة، حاول مرة أخرى', 'error');
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeClearCartDialog();
  }

  submitOrder(): void {
    if (this.submittingOrder) return;

    const validationMessage = this.validateOrderDetails();
    if (validationMessage) {
      this.errorMessage = validationMessage;
      this.toastService.show(validationMessage, 'info');
      return;
    }

    this.shippingData.name = this.shippingData.name.trim();
    this.shippingData.email = this.shippingData.email.trim().toLowerCase();
    this.shippingData.phone = this.shippingData.phone.trim();
    this.shippingData.city = this.shippingData.city.trim();
    this.shippingData.address = this.shippingData.address.trim();

    this.submittingOrder = true;
    this.errorMessage = '';

    const orderPayload = {
      customerInfo: {
        name: this.shippingData.name,
        email: this.shippingData.email,
        phone: this.shippingData.phone,
        hospitalOrClinic: this.shippingData.hospitalOrClinic,
        city: this.shippingData.city,
        address: this.shippingData.address,
        postalCode: this.shippingData.postalCode,
        notes: this.shippingData.notes
      },
      items: this.cartService.cartItems().map((item) => ({
        product: item.product._id || item.product.id,
        name: item.product.name,
        image: item.product.image,
        sku: item.product.sku,
        price: item.product.price,
        quantity: item.quantity
      })),
      paymentMethod: this.shippingData.paymentMethod
    };

    this.orderService.createOrder(orderPayload).subscribe({
      next: (res) => {
        this.submittingOrder = false;
        if (res.success && res.data) {
          this.orderCompleted = true;
          this.createdOrder = res.data;
          this.toastService.show('تم تأكيد طلبك بنجاح');
          this.cartService.clearCart().subscribe();
          this.currentStep = 4;
        }
      },
      error: (err) => {
        this.submittingOrder = false;
        this.errorMessage = err.message || 'تعذر إتمام الطلب، يرجى المحاولة لاحقاً';
        this.toastService.show(this.errorMessage, 'error');
      }
    });
  }
}
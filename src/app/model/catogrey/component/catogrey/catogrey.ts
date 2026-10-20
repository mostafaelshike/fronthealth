import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/models';

@Component({
  selector: 'app-catogrey',
  standalone: false,
  templateUrl: './catogrey.html',
  styleUrl: './catogrey.css',
})
export class Catogrey implements OnInit, OnDestroy {
  categories: Category[] = [];
  loading = true;
  searchQuery = '';
  selectedCategoryId = 'all';
  private loadingTimeout?: ReturnType<typeof setTimeout>;

  get filteredCategories(): Category[] {
    const query = this.searchQuery.trim().toLocaleLowerCase('ar');
    return this.categories.filter((category) => {
      const matchesSelectedCategory =
        this.selectedCategoryId === 'all' || category._id === this.selectedCategoryId;
      const searchableText = `${category.name} ${category.description || ''}`.toLocaleLowerCase('ar');
      return matchesSelectedCategory && (!query || searchableText.includes(query));
    });
  }

  clinicService = {
    title: 'تجهيز احتياجات العيادات والمراكز',
    description:
      'استعرض الأقسام الطبية واختر الأجهزة والمستلزمات التي تناسب تخصصك واحتياج منشأتك.',
    features: [
      'أقسام متنوعة',
      'تفاصيل المنتجات',
      'تواصل مباشر'
    ]
  };

  homeCare = {
    title: 'مستلزمات للرعاية المنزلية',
    description:
      'تصفح منتجات تساعدك على متابعة الرعاية في المنزل، واختر ما يناسب احتياجك من الأقسام المتاحة.',
  };

  whyUs = [
    {
      icon: 'bi-grid',
      title: 'أقسام واضحة ومتنوعة',
      description: 'تصفح المنتجات الطبية حسب القسم للوصول إلى ما تبحث عنه بسهولة.'
    },
    {
      icon: 'bi-card-checklist',
      title: 'تفاصيل تساعدك على الاختيار',
      description: 'راجع معلومات المنتج ومواصفاته قبل اتخاذ قرار الشراء.'
    },
    {
      icon: 'bi-house-heart',
      title: 'احتياجات المنزل والمنشآت',
      description: 'خيارات للأفراد ومقدمي الرعاية والعيادات والمراكز الطبية.'
    },
    {
      icon: 'bi-headset',
      title: 'نحن هنا لمساعدتك',
      description: 'تواصل معنا إذا احتجت مساعدة في العثور على المنتج المناسب.'
    }
  ];

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadingTimeout = setTimeout(() => {
      this.loading = false;
      this.loadingTimeout = undefined;
      this.cdr.detectChanges();
    }, 1000);

    this.categoryService.getCategories().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.categories = res.data;
        }
        this.finishLoading();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.finishLoading();
        console.error('Error fetching categories:', err);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  private finishLoading(): void {
    this.loading = false;
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = undefined;
    }
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchQuery = input.value;
    }
  }

  getCategoryDescription(category: Category): string {
    return category.description?.trim() || `تصفح منتجات ${category.name} واختر ما يناسب احتياجك.`;
  }

  getCategoryIcon(category: Category): string {
    return category.icon || 'bi-heart-pulse';
  }

  browseCategory(category: Category): void {
    this.router.navigate(['/product'], { queryParams: { category: category._id } });
  }

  viewHomeCare(): void {
    this.router.navigate(['/product']);
  }

  contactClinic(): void {
    this.router.navigate(['/conect']);
  }
}
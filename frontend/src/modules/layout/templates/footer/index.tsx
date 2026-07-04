import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { Text } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  });
  const productCategories = await listCategories();

  return (
    <footer className="bg-carbon-dark border-t border-white/5 w-full text-gray-300 py-16">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-8 md:flex-row items-start justify-between pb-12 border-b border-white/5">
          <div className="space-y-4">
            <LocalizedClientLink
              href="/"
              className="text-xl text-white hover:text-brand uppercase font-black tracking-tighter"
            >
              <span className="text-brand">Car</span>Tunez
            </LocalizedClientLink>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed font-semibold">
              Premium automotive customizations and upgrades. Engineered for exact fitment and high performance.
            </p>
          </div>
          <div className="text-small-regular gap-12 md:gap-x-20 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-4">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest block">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2 text-xs text-gray-400 font-semibold"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return;
                    }


                    return (
                      <li
                        className="flex flex-col gap-2"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className="hover:text-brand transition-colors duration-300"
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-4">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest block">
                  Collections
                </span>
                <ul
                  className="grid grid-cols-1 gap-2 text-xs text-gray-400 font-semibold"
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-brand transition-colors duration-300"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-4">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest block">Support & Help</span>
              <ul className="grid grid-cols-1 gap-y-2 text-xs text-gray-400 font-semibold">
                <li>
                  <LocalizedClientLink
                    href="/book-installation"
                    className="hover:text-brand transition-colors duration-300"
                  >
                    Doorstep Fitment
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/support"
                    className="hover:text-brand transition-colors duration-300"
                  >
                    Customer Helpdesk
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/store"
                    className="hover:text-brand transition-colors duration-300"
                  >
                    Store Catalog
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mt-12 justify-between items-center text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <Text className="text-[10px]">
            © {new Date().getFullYear()} Cartunez. All rights reserved.
          </Text>
          <span className="text-[9px] text-gray-600">Premium Performance Styling</span>
        </div>
      </div>
    </footer>
  );
}

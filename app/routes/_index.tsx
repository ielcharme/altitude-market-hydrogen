import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {MARKET_CONFIG} from '~/lib/market-config';

export const meta: Route.MetaFunction = ({data}) => {
  const socialImage = data?.origin
    ? new URL('/og.png', data.origin).toString()
    : undefined;

  return [
    {title: MARKET_CONFIG.brand.title},
    {
      name: 'description',
      content: MARKET_CONFIG.brand.description,
    },
    {property: 'og:title', content: MARKET_CONFIG.brand.title},
    {
      property: 'og:description',
      content: MARKET_CONFIG.brand.description,
    },
    ...(socialImage ? [{property: 'og:image', content: socialImage}] : []),
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: MARKET_CONFIG.brand.title},
    {
      name: 'twitter:description',
      content: MARKET_CONFIG.brand.description,
    },
    ...(socialImage ? [{name: 'twitter:image', content: socialImage}] : []),
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
    origin: new URL(args.request.url).origin,
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home altitude-home">
      <Hero isShopLinked={data.isShopLinked} />
      <ValueStrip />
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
      <CreatorEdit />
      <MarketReadyModules />
    </div>
  );
}

function Hero({isShopLinked}: {isShopLinked: boolean}) {
  return (
    <section className="altitude-hero" aria-labelledby="altitude-hero-title">
      <div className="altitude-hero-copy">
        <p className="eyebrow">{MARKET_CONFIG.hero.eyebrow}</p>
        <h1 id="altitude-hero-title">
          {MARKET_CONFIG.hero.headline[0]}
          <br />
          <em>{MARKET_CONFIG.hero.headline[1]}</em>
        </h1>
        <p className="hero-intro">{MARKET_CONFIG.hero.introduction}</p>
        <div className="hero-actions">
          <Link className="button button-dark" to="/collections/all">
            Explore the winter edit
          </Link>
          <a className="button button-quiet" href="#new-arrivals">
            New arrivals <span aria-hidden="true">↘</span>
          </a>
        </div>
        {!isShopLinked ? (
          <p className="demo-status">
            <span aria-hidden="true" /> Live demo inventory from Mock.shop
          </p>
        ) : null}
      </div>
      <div className="altitude-hero-media">
        <img
          src="/hero-snowboard.jpg"
          alt="Snow-covered alpine ridge in Chamonix-Mont-Blanc"
          width="2200"
          height="3300"
        />
        <div className="hero-media-topline">
          <span>Chamonix / France</span>
          <span>45.9237° N</span>
        </div>
        <div className="hero-media-note">
          <span>Field note / 001</span>
          <strong>Cold air. Clear choices.</strong>
        </div>
        <a
          className="hero-photo-credit"
          href="https://unsplash.com/photos/8L_cpQS8BME"
          rel="noreferrer"
          target="_blank"
        >
          Photo · Martin Masson
        </a>
      </div>
    </section>
  );
}

function ValueStrip() {
  return (
    <section className="value-strip" aria-label="Store commitments">
      <p>
        <strong>01</strong> Selected in the field
      </p>
      <p>
        <strong>02</strong> Landed cost explained
      </p>
      <p>
        <strong>03</strong> Independent maker stories
      </p>
    </section>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <section className="collection-story" aria-labelledby="collection-title">
      <div className="section-kicker">
        <span>Season 26 / 27</span>
        <span>Cold-weather collection</span>
      </div>
      <Link
        className="featured-collection"
        to={`/collections/${collection.handle}`}
      >
        {image ? (
          <div className="featured-collection-image">
            <Image
              data={image}
              sizes="(min-width: 64em) 66vw, 100vw"
              alt={image.altText || collection.title}
            />
          </div>
        ) : null}
        <div className="featured-collection-copy">
          <p>Terrain-led selection</p>
          <h2 id="collection-title">The cold-weather edit.</h2>
          <span>{collection.title} · Explore the collection →</span>
        </div>
      </Link>
    </section>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section
      className="recommended-products product-edit"
      aria-labelledby="new-arrivals"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">The community shortlist</p>
          <h2 id="new-arrivals">Objects for cold days.</h2>
        </div>
        <Link to="/collections/all">View all products →</Link>
      </div>
      <Suspense
        fallback={<div className="product-grid-skeleton">Loading edit…</div>}
      >
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </section>
  );
}

function CreatorEdit() {
  return (
    <section
      className="creator-edit"
      id="creator-edit"
      aria-labelledby="creator-edit-title"
    >
      <div className="creator-edit-index" aria-hidden="true">
        <span>Creator field note</span>
        <strong>01 / 03</strong>
      </div>
      <div className="creator-edit-copy">
        <p className="eyebrow">{MARKET_CONFIG.creatorEdit.label}</p>
        <h2 id="creator-edit-title">{MARKET_CONFIG.creatorEdit.title}</h2>
        <blockquote>“{MARKET_CONFIG.creatorEdit.quote}”</blockquote>
        <p className="creator-role">{MARKET_CONFIG.creatorEdit.role}</p>
        <Link className="button button-paper" to="/collections/all">
          Shop this edit
        </Link>
      </div>
      <div className="creator-edit-notes">
        <p>Inside this edit</p>
        <ul>
          <li>Story-first product discovery</li>
          <li>Reusable creator landing module</li>
          <li>Clear attribution handoff point</li>
        </ul>
      </div>
    </section>
  );
}

function MarketReadyModules() {
  return (
    <section className="market-ready" aria-labelledby="market-ready-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cross-border content system</p>
          <h2 id="market-ready-title">Clarity travels well.</h2>
        </div>
        <p className="module-disclaimer">
          Demo modules · replace with merchant policy
        </p>
      </div>
      <div className="market-ready-grid">
        {MARKET_READY_MODULES.map((module) => (
          <article key={module.number}>
            <span>{module.number}</span>
            <h3>{module.title}</h3>
            <p>{module.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const MARKET_READY_MODULES = [
  {
    number: '01',
    title: 'Delivery clarity',
    copy: 'A dedicated content zone for destination, delivery window and carrier expectations.',
  },
  {
    number: '02',
    title: 'Duties before checkout',
    copy: 'A reusable place to explain whether taxes and import duties are included or collected later.',
  },
  {
    number: '03',
    title: 'Local market context',
    copy: 'Space for language, currency, sizing and market-specific returns information.',
  },
] as const;

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;

import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";

actor {
  include MixinStorage();

  // Product Management
  public type Product = {
    id : Nat;
    name : Text;
    purchasePrice : Nat;
    salePrice : Nat;
    description : Text;
    images : [Storage.ExternalBlob];
    specs : Text;
    tags : [Text];
  };

  public type ProductInput = {
    id : ?Nat;
    name : Text;
    purchasePrice : Nat;
    salePrice : Nat;
    description : Text;
    images : [Storage.ExternalBlob];
    specs : Text;
    tags : [Text];
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Nat.compare(product1.id, product2.id);
    };
  };

  public type Affiliate = {
    id : Nat;
    link : Text;
    commission : Nat;
    notes : Text;
  };

  module Affiliate {
    public func compare(affiliate1 : Affiliate, affiliate2 : Affiliate) : Order.Order {
      switch (Nat.compare(affiliate1.id, affiliate2.id)) {
        case (#equal) { Text.compare(affiliate1.link, affiliate2.link) };
        case (order) { order };
      };
    };
  };

  public type ProductContent = {
    title : Text;
    purchasePrice : Nat;
    salePrice : Nat;
    description : Text;
    specs : Text;
    tags : [Text];
  };

  public type ContentHistoryEntry = {
    id : Nat;
    url : Text;
    timestamp : Time.Time;
    content : ProductContent;
    notes : Text;
  };

  var nextProductId = 0;
  var nextAffiliateId = 0;

  let products = Map.empty<Nat, Product>();
  let affiliates = Map.empty<Nat, Affiliate>();

  // Content Generation Parameters
  type GenerationParams = {
    url : Text;
    image : ?Storage.ExternalBlob;
    audio : ?Storage.ExternalBlob;
    freeText : Text;
  };

  // Settings
  public type UITheme = {
    accentColor : Text;
    fontSize : Nat;
    darkMode : Bool;
  };

  public type ContentPreferences = {
    tone : Text;
    language : Text;
    style : Text;
  };

  public type AppSettings = {
    theme : UITheme;
    contentPrefs : ContentPreferences;
    defaultPlatform : Text;
    autoSave : Bool;
    technical : Text;
  };

  var settings : ?AppSettings = null;

  // Placeholder function for content generation
  public shared ({ caller }) func generateContent(_params : GenerationParams) : async ProductContent {
    Runtime.trap("Content generation must be done client-side.");
  };

  // Structs for HttpResult
  public type HttpResult = {
    status : Nat;
    body : Text;
    error : Text;
  };

  // Transformation function for HTTP outcall responses
  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func fetchUrl(url : Text) : async HttpResult {
    let response = await OutCall.httpGetRequest(url, [], transform);
    {
      status = 200;
      body = response;
      error = "";
    };
  };

  // Product Management Functions

  public shared ({ caller }) func addOrUpdateProduct(productInput : ProductInput) : async Nat {
    let productId = switch (productInput.id) {
      case (null) {
        let newId = nextProductId;
        nextProductId += 1;
        newId;
      };
      case (?id) {
        id;
      };
    };
    let product = {
      id = productId;
      name = productInput.name;
      purchasePrice = productInput.purchasePrice;
      salePrice = productInput.salePrice;
      description = productInput.description;
      images = productInput.images;
      specs = productInput.specs;
      tags = productInput.tags;
    };
    products.add(productId, product);
    productId;
  };

  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public query ({ caller }) func getProduct(id : Nat) : async ?Product {
    products.get(id);
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    products.remove(id);
  };

  // Affiliate Management Functions

  public shared ({ caller }) func addOrUpdateAffiliate(affiliate : Affiliate) : async Nat {
    let affiliateId = switch (affiliates.get(affiliate.id)) {
      case (null) {
        let newId = nextAffiliateId;
        nextAffiliateId += 1;
        newId;
      };
      case (?_) {
        affiliate.id;
      };
    };
    let newAffiliate = {
      id = affiliateId;
      link = affiliate.link;
      commission = affiliate.commission;
      notes = affiliate.notes;
    };
    affiliates.add(affiliateId, newAffiliate);
    affiliateId;
  };

  public query ({ caller }) func getAffiliates() : async [Affiliate] {
    affiliates.values().toArray().sort();
  };

  public query ({ caller }) func getAffiliate(id : Nat) : async ?Affiliate {
    affiliates.get(id);
  };

  public shared ({ caller }) func deleteAffiliate(id : Nat) : async () {
    affiliates.remove(id);
  };

  // Settings Management Functions

  public shared ({ caller }) func updateSettings(newSettings : AppSettings) : async () {
    settings := ?newSettings;
  };

  public query ({ caller }) func getSettings() : async ?AppSettings {
    settings;
  };
};
